import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  agentKindEnum,
  scopeKindEnum,
  stepStatusEnum,
  trainingPairSourceEnum,
  tuningStatusEnum,
} from '../enums.js';
import { workspaces } from './tenancy.js';

export const agentDefinitions = pgTable(
  'agent_definitions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    key: text('key').notNull(),
    name: text('name').notNull(),
    kind: agentKindEnum('kind').notNull(),
    prompt: text('prompt').notNull(),
    promptHash: text('prompt_hash').notNull(),
    model: text('model').notNull(),
    toolsAllowed: text('tools_allowed').array().notNull().default(sql`'{}'::text[]`),
    requiresBoundary: boolean('requires_boundary').notNull().default(false),
    version: integer('version').notNull().default(1),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    scopeIdx: index('agent_definitions_scope_idx').on(t.scope, t.scopeId),
    keyUnique: uniqueIndex('agent_definitions_scope_key_version_uq').on(
      t.scope,
      t.scopeId,
      t.key,
      t.version,
    ),
  }),
);

export const agentRuns = pgTable(
  'agent_runs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    agentKey: text('agent_key').notNull(),
    caller: text('caller'),
    inputs: jsonb('inputs').notNull().default(sql`'{}'::jsonb`),
    outputs: jsonb('outputs'),
    tokensIn: integer('tokens_in').notNull().default(0),
    tokensOut: integer('tokens_out').notNull().default(0),
    costCents: integer('cost_cents').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    status: stepStatusEnum('status').notNull().default('queued'),
    error: jsonb('error'),
    correlationId: text('correlation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('agent_runs_workspace_idx').on(t.workspaceId),
    agentIdx: index('agent_runs_agent_idx').on(t.workspaceId, t.agentKey),
    startedAtIdx: index('agent_runs_started_at_idx').on(t.workspaceId, t.startedAt),
    statusIdx: index('agent_runs_status_idx').on(t.workspaceId, t.status),
  }),
);

export const trainingPairs = pgTable(
  'training_pairs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    agentKey: text('agent_key').notNull(),
    prompt: jsonb('prompt').notNull().default(sql`'{}'::jsonb`),
    chosen: jsonb('chosen').notNull().default(sql`'{}'::jsonb`),
    rejected: jsonb('rejected'),
    source: trainingPairSourceEnum('source').notNull(),
    quality: numeric('quality'),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('training_pairs_workspace_idx').on(t.workspaceId),
    agentIdx: index('training_pairs_agent_idx').on(t.workspaceId, t.agentKey),
    sourceIdx: index('training_pairs_source_idx').on(t.workspaceId, t.source),
  }),
);

export const agentTuningRuns = pgTable(
  'agent_tuning_runs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    agentKey: text('agent_key').notNull(),
    baseModel: text('base_model').notNull(),
    pairsCount: integer('pairs_count').notNull().default(0),
    evalScoreBefore: numeric('eval_score_before'),
    evalScoreAfter: numeric('eval_score_after'),
    status: tuningStatusEnum('status').notNull().default('queued'),
    adapterUri: text('adapter_uri'),
    error: jsonb('error'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('agent_tuning_runs_workspace_idx').on(t.workspaceId),
    agentIdx: index('agent_tuning_runs_agent_idx').on(t.workspaceId, t.agentKey),
    statusIdx: index('agent_tuning_runs_status_idx').on(t.workspaceId, t.status),
  }),
);

export type AgentDefinition = typeof agentDefinitions.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
export type TrainingPair = typeof trainingPairs.$inferSelect;
export type AgentTuningRun = typeof agentTuningRuns.$inferSelect;
