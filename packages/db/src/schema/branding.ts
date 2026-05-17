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
import { scopeKindEnum } from '../enums.js';

export const brandIdentities = pgTable(
  'brand_identities',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    displayName: text('display_name').notNull(),
    tomName: text('tom_name').notNull().default('Tom'),
    timName: text('tim_name').notNull().default('Tim'),
    specialistRenames: jsonb('specialist_renames').notNull().default(sql`'{}'::jsonb`),
    primaryDomain: text('primary_domain'),
    themeTokens: jsonb('theme_tokens').notNull().default(sql`'{}'::jsonb`),
    logoUrl: text('logo_url'),
    faviconUrl: text('favicon_url'),
    emailSender: text('email_sender'),
    emailSignature: text('email_signature'),
    voiceIntro: text('voice_intro'),
    voiceVoiceId: text('voice_voice_id'),
    slackBotIdentity: jsonb('slack_bot_identity').notNull().default(sql`'{}'::jsonb`),
    legalLinks: jsonb('legal_links').notNull().default(sql`'{}'::jsonb`),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scopeIdx: index('brand_identities_scope_idx').on(t.scope, t.scopeId),
    scopeUnique: uniqueIndex('brand_identities_scope_uq').on(t.scope, t.scopeId),
  }),
);

export type BrandIdentity = typeof brandIdentities.$inferSelect;
