export type {
  ComplianceRecord,
  DeliveryResult,
  InboxItemRow,
  Logger,
  NotificationDeliveryRow,
  NotificationPayload,
  NotificationPriority,
  NotificationsDb,
  OptInRecord,
  QuietHours,
  UserChannelPref,
  UserPreferences,
} from './types.js';
export { NotificationPayloadSchema, NotificationPrioritySchema } from './types.js';

export { build, type NotificationSpec } from './notification.js';
export { FanoutEngine, type FanoutEngineDeps } from './fanout.js';
export { PreferenceManager, type PreferenceManagerDeps } from './preferences.js';
export {
  InMemoryIdempotencyStore,
  type IdempotencyStore,
} from './idempotency.js';
export { NotificationAuditor, type NotificationAuditorDeps } from './audit.js';
export { isQuietTimeNow, getTimezoneOffsetMs } from './quiet-hours.js';

export type { Channel, FetchLike } from './channels/base.js';
export { getFetch, notConfigured } from './channels/base.js';
export { InAppChannel, type InAppChannelDeps } from './channels/in-app.js';
export {
  EmailChannel,
  type EmailChannelDeps,
  type EmailConfig,
} from './channels/email.js';
export {
  PushChannel,
  type PushChannelDeps,
  type PushConfig,
} from './channels/push.js';
export {
  SlackDmChannel,
  type SlackDmChannelDeps,
  type SlackConfig,
} from './channels/slack-dm.js';
export {
  TeamsDmChannel,
  type TeamsDmChannelDeps,
  type TeamsConfig,
} from './channels/teams-dm.js';
export {
  SmsChannel,
  type SmsChannelDeps,
  type SmsConfig,
} from './channels/sms.js';
export {
  VoiceChannel,
  type VoiceChannelDeps,
  type VoiceConfig,
} from './channels/voice.js';

export const VERSION = '0.0.0';
