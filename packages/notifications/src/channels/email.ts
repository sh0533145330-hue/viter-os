import type { DeliveryResult, Logger, NotificationPayload } from '../types.js';
import { type Channel, type FetchLike, getFetch, notConfigured } from './base.js';

export interface EmailConfig {
  apiKey?: string;
  defaultFrom: string;
  baseUrl?: string;
}

export interface EmailChannelDeps {
  config: EmailConfig;
  logger: Logger;
  fetchFn?: FetchLike;
  resolveAddress?: (userId: string, workspaceId: string) => Promise<string | null>;
}

const DEFAULT_BASE_URL = 'https://api.resend.com';

export class EmailChannel implements Channel {
  readonly key = 'email';
  private readonly config: EmailConfig;
  private readonly logger: Logger;
  private readonly fetchFn: FetchLike;
  private readonly resolveAddress: (
    userId: string,
    workspaceId: string,
  ) => Promise<string | null>;

  constructor(deps: EmailChannelDeps) {
    this.config = deps.config;
    this.logger = deps.logger;
    this.fetchFn = getFetch(deps.fetchFn);
    this.resolveAddress =
      deps.resolveAddress ?? (async () => null);
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.apiKey);
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!this.config.apiKey) {
      this.logger.warn('email.not_configured');
      return notConfigured(this.key);
    }

    const to =
      typeof payload.data?.['to'] === 'string'
        ? (payload.data['to'] as string)
        : await this.resolveAddress(payload.userId, payload.workspaceId);

    if (!to) {
      return { channel: this.key, delivered: false, error: 'NO_RECIPIENT' };
    }

    const baseUrl = (this.config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const body = {
      from: this.config.defaultFrom,
      to: [to],
      subject: payload.title,
      text: payload.body,
      headers: {
        'X-Vita-Workspace': payload.workspaceId,
        'X-Vita-Kind': payload.kind,
        'List-Unsubscribe': `<${baseUrl}/unsubscribe?u=${encodeURIComponent(payload.userId)}>`,
      },
    };

    try {
      const res = await this.fetchFn(`${baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { channel: this.key, delivered: false, error: `HTTP ${res.status} ${text}` };
      }
      const json = (await res.json().catch(() => ({}))) as { id?: string };
      const result: DeliveryResult = { channel: this.key, delivered: true };
      if (json.id) result.channelMessageId = json.id;
      return result;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.logger.error('email.delivery_failed', { error: err });
      return { channel: this.key, delivered: false, error: err };
    }
  }
}
