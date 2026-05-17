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
import { workspaces } from './tenancy.js';

export const views = pgTable(
  'views',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name'),
    kind: text('kind').notNull(),
    definition: jsonb('definition').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('views_workspace_idx').on(t.workspaceId),
    keyUnique: uniqueIndex('views_workspace_key_uq').on(t.workspaceId, t.key),
  }),
);

export const dashboards = pgTable(
  'dashboards',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    layout: jsonb('layout').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('dashboards_workspace_idx').on(t.workspaceId),
    keyUnique: uniqueIndex('dashboards_workspace_key_uq').on(t.workspaceId, t.key),
  }),
);

export const boards = pgTable(
  'boards',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    columns: jsonb('columns').notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('boards_workspace_idx').on(t.workspaceId),
    keyUnique: uniqueIndex('boards_workspace_key_uq').on(t.workspaceId, t.key),
  }),
);

export const viewCaches = pgTable(
  'view_caches',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    viewId: uuid('view_id')
      .notNull()
      .references(() => views.id, { onDelete: 'cascade' }),
    cacheKey: text('cache_key').notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
    ttlSeconds: integer('ttl_seconds').notNull().default(300),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('view_caches_workspace_idx').on(t.workspaceId),
    viewIdx: index('view_caches_view_idx').on(t.viewId),
    cacheKeyUnique: uniqueIndex('view_caches_view_cache_key_uq').on(t.viewId, t.cacheKey),
    computedAtIdx: index('view_caches_computed_at_idx').on(t.workspaceId, t.computedAt),
  }),
);

export type View = typeof views.$inferSelect;
export type Dashboard = typeof dashboards.$inferSelect;
export type Board = typeof boards.$inferSelect;
export type ViewCache = typeof viewCaches.$inferSelect;
