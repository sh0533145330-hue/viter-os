import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';
import { linkKindEnum, scopeKindEnum } from '../enums.js';
import { users, workspaces } from './tenancy.js';

export const objectTypes = pgTable(
  'object_types',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    schemaVersion: integer('schema_version').notNull().default(1),
    definition: jsonb('definition').notNull().default(sql`'{}'::jsonb`),
    labelSingular: text('label_singular'),
    labelPlural: text('label_plural'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    scopeIdx: index('object_types_scope_idx').on(t.scope, t.scopeId),
    keyUnique: uniqueIndex('object_types_scope_key_version_uq').on(
      t.scope,
      t.scopeId,
      t.key,
      t.schemaVersion,
    ),
  }),
);

export const linkTypes = pgTable(
  'link_types',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    fromType: uuid('from_type')
      .notNull()
      .references(() => objectTypes.id, { onDelete: 'restrict' }),
    toType: uuid('to_type')
      .notNull()
      .references(() => objectTypes.id, { onDelete: 'restrict' }),
    kind: linkKindEnum('kind').notNull().default('1:N'),
    definition: jsonb('definition').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    scopeIdx: index('link_types_scope_idx').on(t.scope, t.scopeId),
    keyUnique: uniqueIndex('link_types_scope_key_uq').on(t.scope, t.scopeId, t.key),
  }),
);

export const actionTypes = pgTable(
  'action_types',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    key: text('key').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    targetType: uuid('target_type').references(() => objectTypes.id, { onDelete: 'restrict' }),
    definition: jsonb('definition').notNull().default(sql`'{}'::jsonb`),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    scopeIdx: index('action_types_scope_idx').on(t.scope, t.scopeId),
    keyUnique: uniqueIndex('action_types_scope_key_uq').on(t.scope, t.scopeId, t.key),
  }),
);

export const propertyTypes = pgTable(
  'property_types',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    ownerType: uuid('owner_type')
      .notNull()
      .references(() => objectTypes.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name'),
    dataType: text('data_type').notNull(),
    isTimeseries: boolean('is_timeseries').notNull().default(false),
    isGeotime: boolean('is_geotime').notNull().default(false),
    isRequired: boolean('is_required').notNull().default(false),
    validations: jsonb('validations').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ownerIdx: index('property_types_owner_idx').on(t.ownerType),
    keyUnique: uniqueIndex('property_types_owner_key_uq').on(t.ownerType, t.key),
  }),
);

export const entities = pgTable(
  'entities',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    objectTypeId: uuid('object_type_id')
      .notNull()
      .references(() => objectTypes.id, { onDelete: 'restrict' }),
    externalId: text('external_id'),
    name: text('name').notNull(),
    attributes: jsonb('attributes').notNull().default(sql`'{}'::jsonb`),
    embedding: vector('embedding', { dimensions: 1536 }),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('entities_workspace_idx').on(t.workspaceId),
    typeIdx: index('entities_workspace_type_idx').on(t.workspaceId, t.objectTypeId),
    externalIdx: index('entities_workspace_external_idx').on(t.workspaceId, t.objectTypeId, t.externalId),
    statusIdx: index('entities_workspace_status_idx').on(t.workspaceId, t.status),
  }),
);

export const entityLinks = pgTable(
  'entity_links',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    linkTypeId: uuid('link_type_id')
      .notNull()
      .references(() => linkTypes.id, { onDelete: 'restrict' }),
    fromEntity: uuid('from_entity')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    toEntity: uuid('to_entity')
      .notNull()
      .references(() => entities.id, { onDelete: 'cascade' }),
    attributes: jsonb('attributes').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('entity_links_workspace_idx').on(t.workspaceId),
    fromIdx: index('entity_links_from_idx').on(t.workspaceId, t.fromEntity),
    toIdx: index('entity_links_to_idx').on(t.workspaceId, t.toEntity),
    typeIdx: index('entity_links_type_idx').on(t.workspaceId, t.linkTypeId),
  }),
);

export const entityActions = pgTable(
  'entity_actions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    actionTypeId: uuid('action_type_id')
      .notNull()
      .references(() => actionTypes.id, { onDelete: 'restrict' }),
    subjectEntity: uuid('subject_entity').references(() => entities.id, { onDelete: 'set null' }),
    targetEntity: uuid('target_entity').references(() => entities.id, { onDelete: 'set null' }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    actorAgent: text('actor_agent'),
    params: jsonb('params').notNull().default(sql`'{}'::jsonb`),
    outcome: text('outcome'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('entity_actions_workspace_idx').on(t.workspaceId),
    typeIdx: index('entity_actions_type_idx').on(t.workspaceId, t.actionTypeId),
    occurredAtIdx: index('entity_actions_occurred_at_idx').on(t.workspaceId, t.occurredAt),
    subjectIdx: index('entity_actions_subject_idx').on(t.workspaceId, t.subjectEntity),
  }),
);

export type ObjectType = typeof objectTypes.$inferSelect;
export type LinkType = typeof linkTypes.$inferSelect;
export type ActionType = typeof actionTypes.$inferSelect;
export type PropertyType = typeof propertyTypes.$inferSelect;
export type Entity = typeof entities.$inferSelect;
export type EntityLink = typeof entityLinks.$inferSelect;
export type EntityAction = typeof entityActions.$inferSelect;
