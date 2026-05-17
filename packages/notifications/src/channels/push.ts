import type { DeliveryResult, Logger, NotificationPayload } from '../types.js';
import { type Channel, type FetchLike, getFetch, notConfigured } from './base.js';

export interface PushConfig {
  expoAccessToken?: string;
  baseUrl?: string;
}

export interface PushChannelDeps {
  config: PushConfig;
  logger: Logger;
  fetchFn?: FetchLike;
  resolveTokens?: (userId: string, workspaceId: string) => Promise<string[]>;
}

const DEFAULT_BASE_URL = 'https://exp.host';

export class PushChannel implements Channel {
  readonly key = 'push';
  private readonly config: PushConfig;
  private readonly logger: Logger;
  private readonly fetchFn: FetchLike;
  private readonly resolveTokens: (
    userId: string,
    workspaceId: string,
  ) => Promise<string[]>;

  constructor(deps: PushChannelDeps) {
    this.config = deps.config;
    this.logger = deps.logger;
    this.fetchFn = getFetch(deps.fetchFn);
    this.resolveTokens = deps.resolveTokens ?? (async () => []);
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.expoAccessToken);
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!this.config.expoAccessToken) {
      return notConfigured(this.key);
    }
    const tokens = await this.resolveTokens(payload.userId, payload.workspaceId);
    if (tokens.length === 0) {
      return { channel: this.key, delivered: false, error: 'NO_DEVICE_TOKENS' };
    }
    const baseUrl = (this.config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const messages = tokens.map((token) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      priority: payload.priority === 'urgent' ? 'high' : 'default',
      data: payload.data ?? {},
    }));
    try {
      const res = await this.fetchFn(`${baseUrl}/--/api/v2/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.expoAccessToken}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { channel: this.key, delivered: false, error: `HTTP ${res.status} ${text}` };
      }
      return { channel: this.key, delivered: true };
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.logger.error('push.delivery_failed', { error: err });
      return { channel: this.key, delivered: false, error: err };
    }
  }
}
