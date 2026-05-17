import { z } from 'zod';

export interface Logger {
  info(msg: string, data?: object): void;
  warn(msg: string, data?: object): void;
  error(msg: string, data?: object): void;
  debug?(msg: string, data?: object): void;
}

export const NotificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export type NotificationPriority = z.infer<typeof NotificationPrioritySchema>;

export const NotificationPayloadSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  kind: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
  priority: NotificationPrioritySchema,
  expiresAt: z.date().optional(),
  idempotencyKey: z.string().optional(),
});
export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;

export interface DeliveryResult {
  channel: string;
  delivered: boolean;
  channelMessageId?: string;
  error?: string;
  skipped?: boolean;
  skippedReason?: 'quiet_hours' | 'opted_out' | 'idempotent' | 'channel_disabled';
}

export interface QuietHours {
  start: string;
  end: string;
  timezone: string;
}

export interface UserChannelPref {
  enabled: boolean;
  quietHours?: QuietHours;
}

export interface UserPreferences {
  userId: string;
  workspaceId: string;
  channels: Record<string, UserChannelPref>;
  bundlingEnabled: boolean;
}

export interface InboxItemRow {
  id: string;
  userId: string;
  workspaceId: string;
  kind: string;
  title?: string;
  payload: Record<string, unknown>;
  status: string;
  priority: string;
  dueAt?: Date;
  correlationId?: string;
  createdAt: Date;
}

export interface NotificationDeliveryRow {
  id: string;
  workspaceId: string;
  userId: string;
  channel: string;
  kind: string;
  status: 'delivered' | 'failed' | 'skipped';
  channelMessageId?: string;
  error?: string;
  idempotencyKey?: string;
  createdAt: Date;
}

export interface ComplianceRecord {
  workspaceId: string;
  channel: string;
  registrationStatus: 'verified' | 'pending' | 'unverified' | 'rejected';
  optInRecords: Map<string, OptInRecord>;
}

export interface OptInRecord {
  userId: string;
  method: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface NotificationsDb {
  insertInboxItem(input: Omit<InboxItemRow, 'id' | 'createdAt'>): Promise<InboxItemRow>;
  getPreferences(userId: string, workspaceId: string): Promise<UserPreferences | null>;
  upsertPreferences(prefs: UserPreferences): Promise<void>;
  insertDelivery(input: Omit<NotificationDeliveryRow, 'id' | 'createdAt'>): Promise<NotificationDeliveryRow>;
  listDeliveries(workspaceId: string, userId?: string, limit?: number): Promise<NotificationDeliveryRow[]>;
  getCompliance(workspaceId: string, channel: string): Promise<ComplianceRecord | null>;
}
