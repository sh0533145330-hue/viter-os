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
import { billingModelEnum, scopeKindEnum } from '../enums.js';

export const billingConfigs = pgTable(
  'billing_configs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    scope: scopeKindEnum('scope').notNull(),
    scopeId: uuid('scope_id'),
    model: billingModelEnum('model').notNull(),
    stripeAccountId: text('stripe_account_id'),
    pricing: jsonb('pricing').notNull().default(sql`'{}'::jsonb`),
    active: boolean('active').notNull().default(true),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scopeIdx: index('billing_configs_scope_idx').on(t.scope, t.scopeId),
    activeUnique: uniqueIndex('billing_configs_scope_active_uq')
      .on(t.scope, t.scopeId)
      .where(sql`active = true`),
  }),
);

export type BillingConfig = typeof billingConfigs.$inferSelect;
