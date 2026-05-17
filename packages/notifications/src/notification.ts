import { NotificationPayloadSchema, type NotificationPayload } from './types.js';

export interface NotificationSpec {
  workspaceId: string;
  userId: string;
  kind: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: NotificationPayload['priority'];
  expiresAt?: Date;
  idempotencyKey?: string;
}

export function build(spec: NotificationSpec): NotificationPayload {
  const payload: NotificationPayload = NotificationPayloadSchema.parse({
    workspaceId: spec.workspaceId,
    userId: spec.userId,
    kind: spec.kind,
    title: spec.title,
    body: spec.body,
    ...(spec.data !== undefined ? { data: spec.data } : {}),
    priority: spec.priority ?? 'normal',
    ...(spec.expiresAt !== undefined ? { expiresAt: spec.expiresAt } : {}),
    ...(spec.idempotencyKey !== undefined ? { idempotencyKey: spec.idempotencyKey } : {}),
  });
  return payload;
}
