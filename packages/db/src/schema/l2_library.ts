import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { libraryItemKindEnum, packDeploymentStatusEnum, scopeKindEnum } from '../enums.js';
import { workspaces } from './tenancy.js';

export const libraryItems = pgTable(
  'library_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    kind: libraryItemKindEnum('kind').notNull(),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    definition: jsonb('definition').notNull().default(sql`'{}'::jsonb`),
    signedBy: text('signed_by'),
    signature: text('signature'),
    evalScore: numeric('eval_score'),
    evalReport: jsonb('eval_report'),
    version: text('version'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    scopeIdx: index('library_items_scope_idx').on(t.scope, t.scopeId),
    kindIdx: index('library_items_kind_idx').on(t.kind),
    keyUnique: uniqueIndex('library_items_scope_kind_key_version_uq').on(
      t.scope,
      t.scopeId,
      t.kind,
      t.key,
      t.version,
    ),
  }),
);

export const packs = pgTable(
  'packs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    vertical: text('vertical'),
    vendor: text('vendor'),
    license: text('license'),
    homepage: text('homepage'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    scopeIdx: index('packs_scope_idx').on(t.scope, t.scopeId),
    keyUnique: uniqueIndex('packs_scope_key_uq').on(t.scope, t.scopeId, t.key),
  }),
);

export const packVersions = pgTable(
  'pack_versions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    packId: uuid('pack_id')
      .notNull()
      .references(() => packs.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    manifest: jsonb('manifest').notNull().default(sql`'{}'::jsonb`),
    signature: text('signature'),
    evalReport: jsonb('eval_report'),
    changelog: text('changelog'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    packIdx: index('pack_versions_pack_idx').on(t.packId),
    versionUnique: uniqueIndex('pack_versions_pack_version_uq').on(t.packId, t.version),
  }),
);

export const packDeployments = pgTable(
  'pack_deployments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    packVersionId: uuid('pack_version_id')
      .notNull()
      .references(() => packVersions.id, { onDelete: 'restrict' }),
    status: packDeploymentStatusEnum('status').notNull().default('pending'),
    pinned: boolean('pinned').notNull().default(false),
    deployedBy: uuid('deployed_by'),
    deployedAt: timestamp('deployed_at', { withTimezone: true }),
    config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('pack_deployments_workspace_idx').on(t.workspaceId),
    packVersionIdx: index('pack_deployments_pack_version_idx').on(t.packVersionId),
    uniqueDeployment: uniqueIndex('pack_deployments_workspace_pack_version_uq').on(
      t.workspaceId,
      t.packVersionId,
    ),
  }),
);

export const labelOverrides = pgTable(
  'label_overrides',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    packVersionId: uuid('pack_version_id').references(() => packVersions.id, { onDelete: 'cascade' }),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    key: text('key').notNull(),
    labelSingular: text('label_singular'),
    labelPlural: text('label_plural'),
    locale: text('locale').notNull().default('en-US'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scopeIdx: index('label_overrides_scope_idx').on(t.scope, t.scopeId),
    uniqueOverride: uniqueIndex('label_overrides_scope_key_locale_uq').on(
      t.scope,
      t.scopeId,
      t.key,
      t.locale,
    ),
  }),
);

export type LibraryItem = typeof libraryItems.$inferSelect;
export type Pack = typeof packs.$inferSelect;
export type PackVersion = typeof packVersions.$inferSelect;
export type PackDeployment = typeof packDeployments.$inferSelect;
export type LabelOverride = typeof labelOverrides.$inferSelect;
