import type {
  ComplianceRecord,
  DeliveryResult,
  Logger,
  NotificationPayload,
  NotificationsDb,
} from '../types.js';
import { type Channel, type FetchLike, getFetch, notConfigured } from './base.js';

export interface SmsConfig {
  accountSid?: string;
  authToken?: string;
  from?: string;
  baseUrl?: string;
  enforceA2P10DLC?: boolean;
}

export interface SmsChannelDeps {
  config: SmsConfig;
  logger: Logger;
  fetchFn?: FetchLike;
  resolvePhone?: (userId: string, workspaceId: string) => Promise<string | null>;
  db?: NotificationsDb;
}

const DEFAULT_BASE_URL = 'https://api.twilio.com';
const E164 = /^\+[1-9]\d{6,14}$/;

export class SmsChannel implements Channel {
  readonly key = 'sms';
  private readonly config: SmsConfig;
  private readonly logger: Logger;
  private readonly fetchFn: FetchLike;
  private readonly resolvePhone: (
    userId: string,
    workspaceId: string,
  ) => Promise<string | null>;
  private readonly db: NotificationsDb | undefined;

  constructor(deps: SmsChannelDeps) {
    this.config = deps.config;
    this.logger = deps.logger;
    this.fetchFn = getFetch(deps.fetchFn);
    this.resolvePhone = deps.resolvePhone ?? (async () => null);
    this.db = deps.db;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.accountSid && this.config.authToken && this.config.from);
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!(await this.isAvailable())) return notConfigured(this.key);

    if (this.config.enforceA2P10DLC !== false && this.db) {
      const compliance: ComplianceRecord | null = await this.db.getCompliance(
        payload.workspaceId,
        this.key,
      );
      if (!compliance || compliance.registrationStatus !== 'verified') {
        return {
          channel: this.key,
          delivered: false,
          error: 'A2P_10DLC_NOT_VERIFIED',
        };
      }
      if (!compliance.optInRecords.has(payload.userId)) {
        return { channel: this.key, delivered: false, error: 'NO_OPT_IN' };
      }
    }

    const to =
      typeof payload.data?.['to'] === 'string'
        ? (payload.data['to'] as string)
        : await this.resolvePhone(payload.userId, payload.workspaceId);
    if (!to) return { channel: this.key, delivered: false, error: 'NO_RECIPIENT' };
    if (!E164.test(to)) {
      return { channel: this.key, delivered: false, error: 'INVALID_E164' };
    }

    const text = truncateForSms(`${payload.title}: ${payload.body}`);
    const baseUrl = (this.config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const auth = Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString(
      'base64',
    );
    const form = new URLSearchParams({
      From: this.config.from ?? '',
      To: to,
      Body: text,
    });

    try {
      const res = await this.fetchFn(
        `${baseUrl}/2010-04-01/Accounts/${encodeURIComponent(this.config.accountSid ?? '')}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
          },
          body: form.toString(),
        },
      );
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        return { channel: this.key, delivered: false, error: `HTTP ${res.status} ${t}` };
      }
      const json = (await res.json().catch(() => ({}))) as { sid?: string };
      const result: DeliveryResult = { channel: this.key, delivered: true };
      if (json.sid) result.channelMessageId = json.sid;
      return result;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.logger.error('sms.delivery_failed', { error: err });
      return { channel: this.key, delivered: false, error: err };
    }
  }
}

function truncateForSms(s: string, limit = 160): string {
  if (s.length <= limit) return s;
  return `${s.slice(0, limit - 1)}…`;
}
