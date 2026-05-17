import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { citext } from '../custom-types.js';
import { membershipStatusEnum, scopeKindEnum } from '../enums.js';

export const platforms = pgTable(
  'platforms',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    slugUnique: uniqueIndex('platforms_slug_uq').on(t.slug),
  }),
);

export const agencies = pgTable(
  'agencies',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    platformId: uuid('platform_id')
      .notNull()
      .references(() => platforms.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    brandIdentityId: uuid('brand_identity_id'),
    billingConfigId: uuid('billing_config_id'),
    settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    platformIdx: index('agencies_platform_idx').on(t.platformId),
    slugUnique: uniqueIndex('agencies_platform_slug_uq').on(t.platformId, t.slug),
  }),
);

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    platformId: uuid('platform_id')
      .notNull()
      .references(() => platforms.id, { onDelete: 'restrict' }),
    agencyId: uuid('agency_id').references(() => agencies.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    verticalPackId: uuid('vertical_pack_id'),
    brandIdentityId: uuid('brand_identity_id'),
    settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    platformIdx: index('workspaces_platform_idx').on(t.platformId),
    agencyIdx: index('workspaces_agency_idx').on(t.agencyId),
    slugUnique: uniqueIndex('workspaces_platform_slug_uq').on(t.platformId, t.slug),
  }),
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: citext('email').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    locale: text('locale').notNull().default('en-US'),
    timezone: text('timezone').notNull().default('UTC'),
    settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    emailUnique: uniqueIndex('users_email_uq').on(t.email),
  }),
);

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id').notNull(),
    role: text('role').notNull(),
    scopes: jsonb('scopes').notNull().default(sql`'[]'::jsonb`),
    status: membershipStatusEnum('status').notNull().default('invited'),
    invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    suspendedAt: timestamp('suspended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scopeIdx: index('memberships_scope_idx').on(t.scope, t.scopeId),
    userIdx: index('memberships_user_idx').on(t.userId),
    uniqueMembership: uniqueIndex('memberships_user_scope_uq').on(t.userId, t.scope, t.scopeId),
  }),
);

export type Platform = typeof platforms.$inferSelect;
export type Agency = typeof agencies.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type User = typeof users.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
