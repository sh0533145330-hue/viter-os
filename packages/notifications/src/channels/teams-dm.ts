import type { DeliveryResult, Logger, NotificationPayload } from '../types.js';
import { type Channel, type FetchLike, getFetch, notConfigured } from './base.js';

export interface TeamsConfig {
  accessToken?: string;
  baseUrl?: string;
}

export interface TeamsDmChannelDeps {
  config: TeamsConfig;
  logger: Logger;
  fetchFn?: FetchLike;
  resolveTeamsChat?: (userId: string, workspaceId: string) => Promise<string | null>;
}

const DEFAULT_BASE_URL = 'https://graph.microsoft.com/v1.0';

export class TeamsDmChannel implements Channel {
  readonly key = 'teams_dm';
  private readonly config: TeamsConfig;
  private readonly logger: Logger;
  private readonly fetchFn: FetchLike;
  private readonly resolveTeamsChat: (
    userId: string,
    workspaceId: string,
  ) => Promise<string | null>;

  constructor(deps: TeamsDmChannelDeps) {
    this.config = deps.config;
    this.logger = deps.logger;
    this.fetchFn = getFetch(deps.fetchFn);
    this.resolveTeamsChat = deps.resolveTeamsChat ?? (async () => null);
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.accessToken);
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!this.config.accessToken) return notConfigured(this.key);
    const chatId = await this.resolveTeamsChat(payload.userId, payload.workspaceId);
    if (!chatId) return { channel: this.key, delivered: false, error: 'NO_TEAMS_CHAT' };
    const baseUrl = (this.config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    try {
      const res = await this.fetchFn(`${baseUrl}/chats/${encodeURIComponent(chatId)}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          body: {
            contentType: 'html',
            content: `<strong>${escapeHtml(payload.title)}</strong><br/>${escapeHtml(payload.body)}`,
          },
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
      this.logger.error('teams_dm.delivery_failed', { error: err });
      return { channel: this.key, delivered: false, error: err };
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
