export type Severity = 'info' | 'warning' | 'error' | 'critical';

export type ActorKind = 'user' | 'agent' | 'system';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export interface AlertPayload {
  title: string;
  body: string;
  severity: Severity | string;
  runbookUrl?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertRule {
  key: string;
  description: string;
  severity: Severity;
  query: string;
  threshold: number;
  duration: string;
  destinations: string[];
  runbook?: string;
}

export interface AuditEvent {
  workspaceId: string;
  actorKind: ActorKind;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  ua?: string;
  at: Date;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditQueryFilter {
  workspaceId: string;
  resource?: string;
  action?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface RunbookStep {
  order: number;
  description: string;
  command?: string;
}

export interface Runbook {
  key: string;
  title: string;
  triggers: string[];
  steps: RunbookStep[];
  severity: Severity;
  owner?: string;
}

export interface SLO {
  key: string;
  name: string;
  target: number;
  windowDays: number;
  goodEventQuery: string;
  totalEventQuery: string;
}

export type SLOStatusKind = 'healthy' | 'warning' | 'breach';

export interface SLOStatus {
  key: string;
  currentPct: number;
  errorBudgetRemaining: number;
  errorBudgetSpentPct: number;
  status: SLOStatusKind;
}

export interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}
