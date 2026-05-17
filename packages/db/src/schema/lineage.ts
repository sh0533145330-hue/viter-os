import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { derivationKindEnum, stepStatusEnum } from '../enums.js';
import { workspaces } from './tenancy.js';

export const lineageEdges = pgTable(
  'lineage_edges',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    fromLayer: text('from_layer').notNull(),
    fromId: uuid('from_id').notNull(),
    toLayer: text('to_layer').notNull(),
    toId: uuid('to_id').notNull(),
    edgeKind: text('edge_kind').notNull(),
    attributes: jsonb('attributes').notNull().default(sql`'{}'::jsonb`),
    derivationRunId: uuid('derivation_run_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('lineage_edges_workspace_idx').on(t.workspaceId),
    fromIdx: index('lineage_edges_from_idx').on(t.workspaceId, t.fromLayer, t.fromId),
    toIdx: index('lineage_edges_to_idx').on(t.workspaceId, t.toLayer, t.toId),
    edgeKindIdx: index('lineage_edges_kind_idx').on(t.workspaceId, t.edgeKind),
  }),
);

export const derivationRuns = pgTable(
  'derivation_runs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    runKind: derivationKindEnum('run_kind').notNull(),
    scope: jsonb('scope').notNull().default(sql`'{}'::jsonb`),
    status: stepStatusEnum('status').notNull().default('queued'),
    triggeredBy: text('triggered_by'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    stats: jsonb('stats').notNull().default(sql`'{}'::jsonb`),
    error: jsonb('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('derivation_runs_workspace_idx').on(t.workspaceId),
    statusIdx: index('derivation_runs_status_idx').on(t.workspaceId, t.status),
    startedAtIdx: index('derivation_runs_started_at_idx').on(t.workspaceId, t.startedAt),
  }),
);

export type LineageEdge = typeof lineageEdges.$inferSelect;
export type DerivationRun = typeof derivationRuns.$inferSelect;
