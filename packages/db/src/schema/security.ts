import { sql } from 'drizzle-orm';
import {
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
  apiKeyStatusEnum,
  encryptionKeyStatusEnum,
  scopeKindEnum,
} from '../enums.js';
import { users, workspaces } from './tenancy.js';

export const anonymizationAudit = pgTable(
  'anonymization_audit',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    datasetKind: text('dataset_kind').notNull(),
    kAnon: integer('k_anon'),
    dpEpsilon: numeric('dp_epsilon'),
    redactionRules: jsonb('redaction_rules').notNull().default(sql`'{}'::jsonb`),
    itemCount: integer('item_count').notNull().default(0),
    sample: jsonb('sample'),
    signedBy: text('signed_by'),
    signature: text('signature'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('anonymization_audit_workspace_idx').on(t.workspaceId, t.createdAt),
    datasetIdx: index('anonymization_audit_dataset_idx').on(t.workspaceId, t.datasetKind),
  }),
);

export const encryptionKeys = pgTable(
  'encryption_keys',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    kmsProvider: text('kms_provider').notNull(),
    keyRef: text('key_ref').notNull(),
    alias: text('alias'),
    status: encryptionKeyStatusEnum('status').notNull().default('active'),
    rotatedAt: timestamp('rotated_at', { withTimezone: true }),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scopeIdx: index('encryption_keys_scope_idx').on(t.scope, t.scopeId),
    aliasUnique: uniqueIndex('encryption_keys_scope_alias_uq').on(t.scope, t.scopeId, t.alias),
  }),
);

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    hashed: text('hashed').notNull(),
    prefix: text('prefix').notNull(),
    label: text('label').notNull(),
    scopes: text('scopes').array().notNull().default(sql`'{}'::text[]`),
    status: apiKeyStatusEnum('status').notNull().default('active'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scopeIdx: index('api_keys_scope_idx').on(t.scope, t.scopeId),
    hashedUnique: uniqueIndex('api_keys_hashed_uq').on(t.hashed),
    prefixIdx: index('api_keys_prefix_idx').on(t.prefix),
  }),
);

export const serviceAccounts = pgTable(
  'service_accounts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    label: text('label').notNull(),
    scopes: text('scopes').array().notNull().default(sql`'{}'::text[]`),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    scopeIdx: index('service_accounts_scope_idx').on(t.scope, t.scopeId),
    labelUnique: uniqueIndex('service_accounts_scope_label_uq').on(t.scope, t.scopeId, t.label),
  }),
);

export type AnonymizationAudit = typeof anonymizationAudit.$inferSelect;
export type EncryptionKey = typeof encryptionKeys.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type ServiceAccount = typeof serviceAccounts.$inferSelect;
