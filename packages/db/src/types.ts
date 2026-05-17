import type * as schema from './schema/index.js';

export type Schema = typeof schema;

export type {
  Agency,
  Membership,
  Platform,
  User,
  Workspace,
} from './schema/tenancy.js';

export type { L0Artifact, L0Chunk } from './schema/l0.js';
export type { L1Artifact } from './schema/l1.js';
export type {
  ActionType,
  Entity,
  EntityAction,
  EntityLink,
  LinkType,
  ObjectType,
  PropertyType,
} from './schema/l2_ontology.js';
export type {
  LabelOverride,
  LibraryItem,
  Pack,
  PackDeployment,
  PackVersion,
} from './schema/l2_library.js';
export type {
  MindEvent,
  MindItem,
  MindProposal,
  TimMind,
  TomMind,
} from './schema/l2_mind.js';
export type {
  KeyResult,
  Objective,
  ObjectiveUpdate,
} from './schema/l2_objectives.js';
export type {
  SkillCall,
  SkillDefinition,
  WorkflowDefinition,
  WorkflowEvent,
  WorkflowRun,
  WorkflowStep,
} from './schema/l3.js';
export type { Board, Dashboard, View, ViewCache } from './schema/l4.js';
export type { DerivationRun, LineageEdge } from './schema/lineage.js';
export type { Approval, ApprovalAction, InboxItem } from './schema/inbox.js';
export type { TomBoundaryAct } from './schema/tom_boundary.js';
export type {
  AgentDefinition,
  AgentRun,
  AgentTuningRun,
  TrainingPair,
} from './schema/agents.js';
export type {
  ConnectorInstance,
  SyncError,
  SyncJob,
  SyncRun,
} from './schema/connectors.js';
export type { AuditLog, CostMeter, SourceHealth } from './schema/audit.js';
export type {
  AnonymizationAudit,
  ApiKey,
  EncryptionKey,
  ServiceAccount,
} from './schema/security.js';
export type { BillingConfig } from './schema/billing.js';
export type { BrandIdentity } from './schema/branding.js';

export type ScopeRef = {
  scope: 'platform' | 'agency' | 'workspace' | 'public' | 'user' | 'team';
  scopeId: string | null;
};

export type Layer = 'l0' | 'l1' | 'l2' | 'l3' | 'l4';
