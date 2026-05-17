import type { NotificationAuditor } from './audit.js';
import type { Channel } from './channels/base.js';
import type { IdempotencyStore } from './idempotency.js';
import type { PreferenceManager } from './preferences.js';
import type { DeliveryResult, Logger, NotificationPayload } from './types.js';

export interface FanoutEngineDeps {
  channels: Map<string, Channel>;
  preferences: PreferenceManager;
  idempotency: IdempotencyStore;
  auditor?: NotificationAuditor;
  logger: Logger;
  idempotencyTtlSeconds?: number;
  throttlePerChannelPerSec?: number;
  now?: () => Date;
}

interface ThrottleState {
  windowStart: number;
  count: number;
}

const DEFAULT_TTL = 24 * 60 * 60;
const DEFAULT_THROTTLE = 50;

export class FanoutEngine {
  private readonly channels: Map<string, Channel>;
  private readonly preferences: PreferenceManager;
  private readonly idempotency: IdempotencyStore;
  private readonly auditor: NotificationAuditor | undefined;
  private readonly logger: Logger;
  private readonly idempotencyTtlSeconds: number;
  private readonly throttlePerChannelPerSec: number;
  private readonly now: () => Date;
  private readonly throttle: Map<string, ThrottleState> = new Map();

  constructor(deps: FanoutEngineDeps) {
    this.channels = deps.channels;
    this.preferences = deps.preferences;
    this.idempotency = deps.idempotency;
    this.auditor = deps.auditor;
    this.logger = deps.logger;
    this.idempotencyTtlSeconds = deps.idempotencyTtlSeconds ?? DEFAULT_TTL;
    this.throttlePerChannelPerSec = deps.throttlePerChannelPerSec ?? DEFAULT_THROTTLE;
    this.now = deps.now ?? (() => new Date());
  }

  async send(payload: NotificationPayload, channelKeys: string[]): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];

    if (payload.idempotencyKey) {
      const seen = await this.idempotency.has(payload.idempotencyKey);
      if (seen) {
        this.logger.info('notification.idempotent_skip', {
          idempotencyKey: payload.idempotencyKey,
        });
        for (const key of channelKeys) {
          const r: DeliveryResult = {
            channel: key,
            delivered: false,
            skipped: true,
            skippedReason: 'idempotent',
          };
          results.push(r);
          if (this.auditor) await this.auditor.record(payload, r);
        }
        return results;
      }
      await this.idempotency.record(payload.idempotencyKey, this.idempotencyTtlSeconds);
    }

    const prefs = await this.preferences.get(payload.userId, payload.workspaceId);
    const now = this.now();

    for (const channelKey of channelKeys) {
      const channel = this.channels.get(channelKey);
      if (!channel) {
        const r: DeliveryResult = {
          channel: channelKey,
          delivered: false,
          error: 'CHANNEL_NOT_REGISTERED',
        };
        results.push(r);
        if (this.auditor) await this.auditor.record(payload, r);
        continue;
      }

      if (!this.preferences.isChannelEnabled(prefs, channelKey)) {
        const r: DeliveryResult = {
          channel: channelKey,
          delivered: false,
          skipped: true,
          skippedReason: 'channel_disabled',
        };
        results.push(r);
        if (this.auditor) await this.auditor.record(payload, r);
        continue;
      }

      const allowQuiet = payload.priority === 'urgent';
      if (!allowQuiet && this.preferences.isQuietNow(prefs, channelKey, now)) {
        const r: DeliveryResult = {
          channel: channelKey,
          delivered: false,
          skipped: true,
          skippedReason: 'quiet_hours',
        };
        results.push(r);
        if (this.auditor) await this.auditor.record(payload, r);
        continue;
      }

      if (!this.acquireThrottleSlot(channelKey, now)) {
        const r: DeliveryResult = {
          channel: channelKey,
          delivered: false,
          error: 'THROTTLED',
        };
        results.push(r);
        if (this.auditor) await this.auditor.record(payload, r);
        continue;
      }

      const result = await channel.send(payload);
      results.push(result);
      if (this.auditor) await this.auditor.record(payload, result);
    }
    return results;
  }

  private acquireThrottleSlot(channelKey: string, now: Date): boolean {
    const second = Math.floor(now.getTime() / 1000);
    const state = this.throttle.get(channelKey);
    if (!state || state.windowStart !== second) {
      this.throttle.set(channelKey, { windowStart: second, count: 1 });
      return true;
    }
    if (state.count >= this.throttlePerChannelPerSec) return false;
    state.count += 1;
    return true;
  }
}
