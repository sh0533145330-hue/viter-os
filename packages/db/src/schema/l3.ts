import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  scopeKindEnum,
  stepStatusEnum,
  workflowRunStatusEnum,
  workflowStatusEnum,
} from '../enums.js';
import { workspaces } from './tenancy.js';

export const workflowDefinitions = pgTable(
  'workflow_definitions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    version: integer('version').notNull().default(1),
    graph: jsonb('graph').notNull().default(sql`'{}'::jsonb`),
    inputsSchema: jsonb('inputs_schema').notNull().default(sql`'{}'::jsonb`),
    outputsSchema: jsonb('outputs_schema').notNull().default(sql`'{}'::jsonb`),
    status: workflowStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    scopeIdx: index('workflow_definitions_scope_idx').on(t.scope, t.scopeId),
    keyUnique: uniqueIndex('workflow_definitions_scope_key_version_uq').on(
      t.scope,
      t.scopeId,
      t.key,
      t.version,
    ),
  }),
);

export const workflowRuns = pgTable(
  'workflow_runs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    workflowDefinitionId: uuid('workflow_definition_id')
      .notNull()
      .references(() => workflowDefinitions.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    status: workflowRunStatusEnum('status').notNull().default('queued'),
    inputs: jsonb('inputs').notNull().default(sql`'{}'::jsonb`),
    outputs: jsonb('outputs'),
    error: jsonb('error'),
    triggeredBy: text('triggered_by'),
    correlationId: text('correlation_id'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    costCents: integer('cost_cents').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('workflow_runs_workspace_idx').on(t.workspaceId),
    definitionIdx: index('workflow_runs_definition_idx').on(t.workflowDefinitionId),
    statusIdx: index('workflow_runs_status_idx').on(t.workspaceId, t.status),
    startedAtIdx: index('workflow_runs_started_at_idx').on(t.workspaceId, t.startedAt),
  }),
);

export const workflowSteps = pgTable(
  'workflow_steps',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    runId: uuid('run_id')
      .notNull()
      .references(() => workflowRuns.id, { onDelete: 'cascade' }),
    blockKey: text('block_key').notNull(),
    ordinal: integer('ordinal').notNull(),
    inputs: jsonb('inputs').notNull().default(sql`'{}'::jsonb`),
    outputs: jsonb('outputs'),
    status: stepStatusEnum('status').notNull().default('queued'),
    error: jsonb('error'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    retries: integer('retries').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    runIdx: index('workflow_steps_run_idx').on(t.runId, t.ordinal),
    statusIdx: index('workflow_steps_status_idx').on(t.runId, t.status),
  }),
);

export const workflowEvents = pgTable(
  'workflow_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    runId: uuid('run_id')
      .notNull()
      .references(() => workflowRuns.id, { onDelete: 'cascade' }),
    eventKind: text('event_kind').notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    runIdx: index('workflow_events_run_idx').on(t.runId, t.at),
  }),
);

export const skillDefinitions = pgTable(
  'skill_definitions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    key: text('key').notNull(),
    agentKey: text('agent_key'),
    schema: jsonb('schema').notNull().default(sql`'{}'::jsonb`),
    codeRef: text('code_ref'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    scopeIdx: index('skill_definitions_scope_idx').on(t.scope, t.scopeId),
    keyUnique: uniqueIndex('skill_definitions_scope_key_version_uq').on(
      t.scope,
      t.scopeId,
      t.key,
      t.version,
    ),
  }),
);

export const skillCalls = pgTable(
  'skill_calls',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    skillKey: text('skill_key').notNull(),
    callerAgent: text('caller_agent'),
    inputs: jsonb('inputs').notNull().default(sql`'{}'::jsonb`),
    outputs: jsonb('outputs'),
    status: stepStatusEnum('status').notNull().default('queued'),
    error: jsonb('error'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('skill_calls_workspace_idx').on(t.workspaceId),
    skillIdx: index('skill_calls_skill_idx').on(t.workspaceId, t.skillKey),
    startedAtIdx: index('skill_calls_started_at_idx').on(t.workspaceId, t.startedAt),
  }),
);

export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;
export type WorkflowRun = typeof workflowRuns.$inferSelect;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type WorkflowEvent = typeof workflowEvents.$inferSelect;
export type SkillDefinition = typeof skillDefinitions.$inferSelect;
export type SkillCall = typeof skillCalls.$inferSelect;
