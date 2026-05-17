import type {
  DeliveryResult,
  Logger,
  NotificationDeliveryRow,
  NotificationPayload,
  NotificationsDb,
} from './types.js';

export interface NotificationAuditorDeps {
  db: NotificationsDb;
  logger: Logger;
}

export class NotificationAuditor {
  private readonly db: NotificationsDb;
  private readonly logger: Logger;

  constructor(deps: NotificationAuditorDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
  }

  async record(
    payload: NotificationPayload,
    result: DeliveryResult,
  ): Promise<NotificationDeliveryRow> {
    const status: NotificationDeliveryRow['status'] = result.skipped
      ? 'skipped'
      : result.delivered
        ? 'delivered'
        : 'failed';
    const insert: Omit<NotificationDeliveryRow, 'id' | 'createdAt'> = {
      workspaceId: payload.workspaceId,
      userId: payload.userId,
      channel: result.channel,
      kind: payload.kind,
      status,
    };
    if (result.channelMessageId !== undefined) insert.channelMessageId = result.channelMessageId;
    if (result.error !== undefined) insert.error = result.error;
    if (payload.idempotencyKey !== undefined) insert.idempotencyKey = payload.idempotencyKey;
    const row = await this.db.insertDelivery(insert);
    this.logger.debug?.('notification.audit_recorded', {
      deliveryId: row.id,
      channel: result.channel,
      status,
    });
    return row;
  }

  async list(workspaceId: string, userId?: string, limit?: number): Promise<NotificationDeliveryRow[]> {
    return this.db.listDeliveries(workspaceId, userId, limit);
  }
}
