import type { DeliveryResult, Logger, NotificationPayload } from '../types.js';
import { type Channel, type FetchLike, getFetch, notConfigured } from './base.js';

export interface SlackConfig {
  botToken?: string;
  baseUrl?: string;
}

export interface SlackDmChannelDeps {
  config: SlackConfig;
  logger: Logger;
  fetchFn?: FetchLike;
  resolveSlackUserId?: (userId: string, workspaceId: string) => Promise<string | null>;
}

const DEFAULT_BASE_URL = 'https://slack.com/api';

export class SlackDmChannel implements Channel {
  readonly key = 'slack_dm';
  private readonly config: SlackConfig;
  private readonly logger: Logger;
  private readonly fetchFn: FetchLike;
  private readonly resolveSlackUserId: (
    userId: string,
    workspaceId: string,
  ) => Promise<string | null>;

  constructor(deps: SlackDmChannelDeps) {
    this.config = deps.config;
    this.logger = deps.logger;
    this.fetchFn = getFetch(deps.fetchFn);
    this.resolveSlackUserId = deps.resolveSlackUserId ?? (async () => null);
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.botToken);
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!this.config.botToken) return notConfigured(this.key);
    const slackUserId =
      typeof payload.data?.['slackUserId'] === 'string'
        ? (payload.data['slackUserId'] as string)
        : await this.resolveSlackUserId(payload.userId, payload.workspaceId);
    if (!slackUserId) {
      return { channel: this.key, delivered: false, error: 'NO_SLACK_USER' };
    }
    const baseUrl = (this.config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const text = `*${payload.title}*\n${payload.body}`;
    try {
      const res = await this.fetchFn(`${baseUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${this.config.botToken}`,
        },
        body: JSON.stringify({ channel: slackUserId, text }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        return { channel: this.key, delivered: false, error: `HTTP ${res.status} ${t}` };
      }
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; ts?: string; error?: string };
      if (!json.ok) {
        return { channel: this.key, delivered: false, error: json.error ?? 'SLACK_ERROR' };
      }
      const result: DeliveryResult = { channel: this.key, delivered: true };
      if (json.ts) result.channelMessageId = json.ts;
      return result;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.logger.error('slack_dm.delivery_failed', { error: err });
      return { channel: this.key, delivered: false, error: err };
    }
  }
}
