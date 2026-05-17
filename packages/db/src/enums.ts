import { pgEnum } from 'drizzle-orm/pg-core';

export const scopeKindEnum = pgEnum('scope_kind', ['platform', 'agency', 'workspace', 'public', 'user', 'team']);

export const membershipStatusEnum = pgEnum('membership_status', [
  'invited',
  'active',
  'suspended',
  'revoked',
]);

export const sensitivityEnum = pgEnum('sensitivity', ['public', 'internal', 'confidential', 'restricted']);

export const linkKindEnum = pgEnum('link_kind', ['1:1', '1:N', 'N:M']);

export const libraryItemKindEnum = pgEnum('library_item_kind', [
  'object_type',
  'link_type',
  'action_type',
  'workflow',
  'agent',
  'skill',
  'eval_suite',
  'vocabulary',
  'block',
  'view',
]);

export const packDeploymentStatusEnum = pgEnum('pack_deployment_status', [
  'pending',
  'active',
  'paused',
  'failed',
  'rolled_back',
]);

export const mindKindEnum = pgEnum('mind_kind', ['tom', 'tim']);

export const mindProposalStatusEnum = pgEnum('mind_proposal_status', [
  'pending',
  'accepted',
  'rejected',
  'expired',
]);

export const objectiveScopeEnum = pgEnum('objective_scope', ['user', 'team', 'agency', 'workspace']);

export const objectiveStatusEnum = pgEnum('objective_status', [
  'draft',
  'active',
  'at_risk',
  'on_track',
  'achieved',
  'missed',
  'archived',
]);

export const workflowStatusEnum = pgEnum('workflow_status', ['draft', 'published', 'deprecated']);

export const workflowRunStatusEnum = pgEnum('workflow_run_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'compensating',
]);

export const stepStatusEnum = pgEnum('step_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
  'skipped',
  'compensated',
]);

export const derivationKindEnum = pgEnum('derivation_kind', [
  'reextract',
  'relink',
  'rederive',
  'rematerialize',
]);

export const inboxStatusEnum = pgEnum('inbox_status', ['new', 'snoozed', 'archived', 'actioned']);

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
  'expired',
  'auto_approved',
]);

export const boundaryActKindEnum = pgEnum('boundary_act_kind', [
  'email',
  'slack',
  'sms',
  'voice_call',
  'api_call',
  'webhook',
  'calendar',
]);

export const boundaryActStatusEnum = pgEnum('boundary_act_status', [
  'pending',
  'awaiting_approval',
  'queued',
  'sent',
  'delivered',
  'failed',
  'cancelled',
]);

export const agentKindEnum = pgEnum('agent_kind', ['boundary', 'team', 'specialist', 'librarian']);

export const trainingPairSourceEnum = pgEnum('training_pair_source', [
  'edit',
  'undo',
  'reject',
  'rating',
  'manual',
]);

export const actorKindEnum = pgEnum('actor_kind', ['user', 'agent', 'system']);

export const costMeterKindEnum = pgEnum('cost_meter_kind', [
  'tokens',
  'runs',
  'voice_minutes',
  'scraper_minutes',
  'storage_gb',
  'seat_hours',
  'requests',
]);

export const billingModelEnum = pgEnum('billing_model', [
  'direct',
  'reseller',
  'revenue_share',
  'bundled',
]);

export const connectorStatusEnum = pgEnum('connector_status', [
  'pending',
  'connected',
  'degraded',
  'disconnected',
  'error',
]);

export const tuningStatusEnum = pgEnum('tuning_status', [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
]);

export const apiKeyStatusEnum = pgEnum('api_key_status', ['active', 'revoked', 'expired']);

export const encryptionKeyStatusEnum = pgEnum('encryption_key_status', [
  'active',
  'rotating',
  'retired',
]);
