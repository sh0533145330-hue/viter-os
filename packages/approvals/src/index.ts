export type {
  ApprovalActionRow,
  ApprovalDecision,
  ApprovalRequest,
  ApprovalRow,
  ApprovalStatus,
  AutonomyConfig,
  AutonomyEvaluation,
  AutonomyLevel,
  Db,
  EscalationPolicy,
  FatigueConfig,
  Logger,
  RouteKind,
  RoutingRule,
} from './types.js';
export {
  ApprovalRequestSchema,
  ApprovalStatusSchema,
  AutonomyLevelSchema,
  RouteKindSchema,
} from './types.js';

export { ApprovalService, type ApprovalServiceDeps } from './approval.js';
export { ApprovalRouter, type ApprovalRouterDeps } from './routing.js';
export { AutonomyGate, type AutonomyGateDeps } from './autonomy-gate.js';
export {
  EscalationEngine,
  type EscalationEngineDeps,
  type EscalationResult,
} from './escalation.js';
export { FatigueProtection, type FatigueProtectionDeps } from './fatigue.js';

export const VERSION = '0.0.0';
