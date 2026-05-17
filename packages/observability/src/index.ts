export { createLogger, withLogContext, getLogContext } from './logger.js';
export type { Logger, LogContext, CreateLoggerOptions } from './logger.js';

export { initOtel, withSpan as withOtelSpan } from './otel.js';
export type { OtelOptions } from './otel.js';

export {
  createLogRedactor,
  redactSensitiveKeys,
  SENSITIVE_KEYS,
  REDACTED_VALUE,
} from './pii-redaction.js';
export type { LogRedactorOptions } from './pii-redaction.js';

export {
  generateTraceId,
  generateSpanId,
  newTraceContext,
  childOf,
  getCurrentTrace,
  runWithTrace,
  toTraceparent,
  parseTraceparent,
  withSpan,
} from './trace.js';
export type { WithSpanOptions } from './trace.js';

export {
  MetricsRegistry,
  globalMetrics,
} from './metrics.js';
export type {
  Counter,
  Gauge,
  Histogram,
  HistogramSnapshot,
  MetricSeries,
  MetricType,
} from './metrics.js';

export {
  AlertRuleRegistry,
  COMMON_ALERTS,
  loadCommonAlerts,
} from './alerts.js';

export {
  PagerDutyDestination,
  SlackWebhookDestination,
  EmailDestination,
  AlertDispatcher,
} from './alert-destinations.js';
export type {
  AlertDestination,
  PagerDutyConfig,
  SlackWebhookConfig,
  EmailDestinationConfig,
} from './alert-destinations.js';

export { AuditLogger } from './audit-log.js';
export type { AuditLogDb, AuditLoggerOptions } from './audit-log.js';

export {
  RUNBOOKS,
  getRunbook,
  runbookUrl,
  listRunbooks,
} from './runbooks.js';

export {
  SLOTracker,
  DEFAULT_SLOS,
  loadDefaultSLOs,
} from './slo.js';

export {
  initSentryBackend,
  initSentryFrontend,
  isSentryBackendInitialized,
  isSentryFrontendInitialized,
} from './sentry.js';

export type {
  Severity,
  ActorKind,
  TraceContext,
  AlertPayload,
  AlertRule,
  AuditEvent,
  AuditQueryFilter,
  Runbook,
  RunbookStep,
  SLO,
  SLOStatus,
  SLOStatusKind,
  SentryConfig,
} from './types.js';
