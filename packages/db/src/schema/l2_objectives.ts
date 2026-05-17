import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { objectiveScopeEnum, objectiveStatusEnum } from '../enums.js';
import { users, workspaces } from './tenancy.js';

export const objectives = pgTable(
  'objectives',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    scope: objectiveScopeEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    title: text('title').notNull(),
    description: text('description'),
    parentId: uuid('parent_id'),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    status: objectiveStatusEnum('status').notNull().default('draft'),
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('objectives_workspace_idx').on(t.workspaceId),
    scopeIdx: index('objectives_scope_idx').on(t.workspaceId, t.scope, t.scopeId),
    parentIdx: index('objectives_parent_idx').on(t.parentId),
    statusIdx: index('objectives_status_idx').on(t.workspaceId, t.status),
  }),
);

export const keyResults = pgTable(
  'key_results',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    objectiveId: uuid('objective_id')
      .notNull()
      .references(() => objectives.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    kpiKind: text('kpi_kind').notNull(),
    target: numeric('target'),
    current: numeric('current'),
    unit: text('unit'),
    status: objectiveStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    objectiveIdx: index('key_results_objective_idx').on(t.objectiveId),
  }),
);

export const objectiveUpdates = pgTable(
  'objective_updates',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    objectiveId: uuid('objective_id')
      .notNull()
      .references(() => objectives.id, { onDelete: 'cascade' }),
    body: text('body'),
    delta: jsonb('delta').notNull().default(sql`'{}'::jsonb`),
    postedBy: uuid('posted_by').references(() => users.id, { onDelete: 'set null' }),
    postedAt: timestamp('posted_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    objectiveIdx: index('objective_updates_objective_idx').on(t.objectiveId),
    postedAtIdx: index('objective_updates_posted_at_idx').on(t.objectiveId, t.postedAt),
  }),
);

export type Objective = typeof objectives.$inferSelect;
export type KeyResult = typeof keyResults.$inferSelect;
export type ObjectiveUpdate = typeof objectiveUpdates.$inferSelect;
