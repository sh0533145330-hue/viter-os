import { z } from 'zod';

export interface Logger {
  info(msg: string, data?: object): void;
  warn(msg: string, data?: object): void;
  error(msg: string, data?: object): void;
  debug?(msg: string, data?: object): void;
}

export interface ApprovalRow {
  id: string;
  workspaceId: string;
  requestedByAgent: string;
  actionTypeKey?: string;
  targetUserId?: string;
  payload: Record<string, unknown>;
  summary?: string;
  status: ApprovalStatus;
  autonomyLevel: AutonomyLevel;
  expiresAt?: Date;
  decidedBy?: string;
  decidedAt?: Date;
  decisionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalActionRow {
  id: string;
  approvalId: string;
  routeKind: string;
  channel: string;
  metadata: Record<string, unknown>;
  sentAt?: Date;
  deliveredAt?: Date;
  respondedAt?: Date;
  createdAt: Date;
}

export interface Db {
  insertApproval(input: Omit<ApprovalRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalRow>;
  updateApproval(id: string, patch: Partial<ApprovalRow>): Promise<ApprovalRow | null>;
  getApproval(id: string): Promise<ApprovalRow | null>;
  findApprovalByIdempotencyKey(
    workspaceId: string,
    key: string,
  ): Promise<ApprovalRow | null>;
  listPendingApprovals(workspaceId: string, userId?: string): Promise<ApprovalRow[]>;
  listExpiredPending(now: Date): Promise<ApprovalRow[]>;
  countDecisionsInWindow(userId: string, workspaceId: string, sinceMs: number): Promise<number>;
  countAutoApprovedToday(
    workspaceId: string,
    agentKey: string,
    actionTypeKey: string,
  ): Promise<number>;
  insertApprovalAction(input: Omit<ApprovalActionRow, 'id' | 'createdAt'>): Promise<ApprovalActionRow>;
  resolveTeamLead(workspaceId: string, userId: string): Promise<string | null>;
  resolveManager(workspaceId: string, userId: string): Promise<string | null>;
}

export const AutonomyLevelSchema = z.enum([
  'suggest',
  'draft_confirm',
  'auto_with_limits',
  'auto_with_veto',
]);
export type AutonomyLevel = z.infer<typeof AutonomyLevelSchema>;

export const ApprovalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'expired',
  'auto_approved',
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const ApprovalRequestSchema = z.object({
  workspaceId: z.string().min(1),
  requestedByAgent: z.string().min(1),
  actionTypeKey: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
  autonomyLevel: AutonomyLevelSchema,
  expiresAt: z.date().optional(),
  requestedByUserId: z.string().optional(),
  summary: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

export interface ApprovalDecision {
  status: ApprovalStatus;
  decidedBy?: string;
  decidedAt?: Date;
  rationale?: string;
}

export const RouteKindSchema = z.enum(['user_self', 'team_lead', 'manager', 'policy']);
export type RouteKind = z.infer<typeof RouteKindSchema>;

export interface RoutingRule {
  kind: RouteKind;
  targetUserId?: string;
  condition?: (req: ApprovalRequest) => boolean;
}

export interface AutonomyConfig {
  agentKey: string;
  actionTypeKey: string;
  level: AutonomyLevel;
  limits?: { dailyCount?: number; valueCapCents?: number };
}

export interface AutonomyEvaluation {
  requiresApproval: boolean;
  autoApprove: boolean;
  matchedConfig?: AutonomyConfig;
  reason?: 'no_config' | 'level_suggest' | 'level_draft_confirm' | 'limits_exceeded' | 'auto_within_limits' | 'auto_with_veto';
}

export interface EscalationPolicy {
  initialTimeoutMinutes: number;
  escalateToManager: boolean;
  escalateToTeam: boolean;
  finalAction: 'reject' | 'expire';
}

export interface FatigueConfig {
  maxApprovalsPerHour: number;
  bundlingWindowMs: number;
  autoPromoteAfterCount: number;
}
