import type { DeliveryResult, Logger, NotificationPayload } from '../types.js';
import { type Channel, type FetchLike, getFetch, notConfigured } from './base.js';

export interface VoiceConfig {
  apiKey?: string;
  assistantId?: string;
  baseUrl?: string;
  from?: string;
}

export interface VoiceChannelDeps {
  config: VoiceConfig;
  logger: Logger;
  fetchFn?: FetchLike;
  resolvePhone?: (userId: string, workspaceId: string) => Promise<string | null>;
}

const DEFAULT_BASE_URL = 'https://api.vapi.ai';

export class VoiceChannel implements Channel {
  readonly key = 'voice';
  private readonly config: VoiceConfig;
  private readonly logger: Logger;
  private readonly fetchFn: FetchLike;
  private readonly resolvePhone: (
    userId: string,
    workspaceId: string,
  ) => Promise<string | null>;

  constructor(deps: VoiceChannelDeps) {
    this.config = deps.config;
    this.logger = deps.logger;
    this.fetchFn = getFetch(deps.fetchFn);
    this.resolvePhone = deps.resolvePhone ?? (async () => null);
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.apiKey && this.config.assistantId);
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!this.config.apiKey || !this.config.assistantId) return notConfigured(this.key);
    const to =
      typeof payload.data?.['to'] === 'string'
        ? (payload.data['to'] as string)
        : await this.resolvePhone(payload.userId, payload.workspaceId);
    if (!to) return { channel: this.key, delivered: false, error: 'NO_RECIPIENT' };
    const baseUrl = (this.config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    try {
      const res = await this.fetchFn(`${baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          assistantId: this.config.assistantId,
          customer: { number: to },
          assistantOverrides: {
            firstMessage: `${payload.title}. ${payload.body}`,
            metadata: {
              workspaceId: payload.workspaceId,
              kind: payload.kind,
              ...(payload.data ?? {}),
            },
          },
          ...(this.config.from ? { phoneNumber: { number: this.config.from } } : {}),
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        return { channel: this.key, delivered: false, error: `HTTP ${res.status} ${t}` };
      }
      const json = (await res.json().catch(() => ({}))) as { id?: string };
      const result: DeliveryResult = { channel: this.key, delivered: true };
      if (json.id) result.channelMessageId = json.id;
      return result;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.logger.error('voice.delivery_failed', { error: err });
      return { channel: this.key, delivered: false, error: err };
    }
  }
}
