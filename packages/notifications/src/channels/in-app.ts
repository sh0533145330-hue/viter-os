import type {
  DeliveryResult,
  Logger,
  NotificationPayload,
  NotificationsDb,
} from '../types.js';
import type { Channel } from './base.js';

export interface InAppChannelDeps {
  db: NotificationsDb;
  logger: Logger;
}

export class InAppChannel implements Channel {
  readonly key = 'in_app';
  private readonly db: NotificationsDb;
  private readonly logger: Logger;

  constructor(deps: InAppChannelDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
  }

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    try {
      const row = await this.db.insertInboxItem({
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        kind: payload.kind,
        title: payload.title,
        payload: {
          body: payload.body,
          ...(payload.data ?? {}),
        },
        status: 'new',
        priority: payload.priority,
        ...(payload.expiresAt !== undefined ? { dueAt: payload.expiresAt } : {}),
      });
      return { channel: this.key, delivered: true, channelMessageId: row.id };
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      this.logger.error('in_app.delivery_failed', { error: err });
      return { channel: this.key, delivered: false, error: err };
    }
  }
}
