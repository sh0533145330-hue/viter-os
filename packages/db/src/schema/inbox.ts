import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { approvalStatusEnum, inboxStatusEnum } from '../enums.js';
import { actionTypes } from './l2_ontology.js';
import { users, workspaces } from './tenancy.js';

export const inboxItems = pgTable(
  'inbox_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    title: text('title'),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    status: inboxStatusEnum('status').notNull().default('new'),
    priority: text('priority').notNull().default('normal'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
    correlationId: text('correlation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('inbox_items_user_idx').on(t.userId, t.status),
    workspaceIdx: index('inbox_items_workspace_idx').on(t.workspaceId),
    kindIdx: index('inbox_items_kind_idx').on(t.workspaceId, t.kind),
    dueAtIdx: index('inbox_items_due_at_idx').on(t.userId, t.dueAt),
  }),
);

export const approvals = pgTable(
  'approvals',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    requestedByAgent: text('requested_by_agent').notNull(),
    actionTypeId: uuid('action_type_id').references(() => actionTypes.id, { onDelete: 'set null' }),
    targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'set null' }),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    summary: text('summary'),
    status: approvalStatusEnum('status').notNull().default('pending'),
    autonomyLevel: text('autonomy_level').notNull().default('confirm'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    decidedBy: uuid('decided_by').references(() => users.id, { onDelete: 'set null' }),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decisionReason: text('decision_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('approvals_workspace_idx').on(t.workspaceId),
    statusIdx: index('approvals_status_idx').on(t.workspaceId, t.status),
    expiresIdx: index('approvals_expires_idx').on(t.workspaceId, t.expiresAt),
    actionTypeIdx: index('approvals_action_type_idx').on(t.actionTypeId),
  }),
);

export const approvalActions = pgTable(
  'approval_actions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    approvalId: uuid('approval_id')
      .notNull()
      .references(() => approvals.id, { onDelete: 'cascade' }),
    routeKind: text('route_kind').notNull(),
    channel: text('channel').notNull(),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    approvalIdx: index('approval_actions_approval_idx').on(t.approvalId),
    channelIdx: index('approval_actions_channel_idx').on(t.channel),
  }),
);

export type InboxItem = typeof inboxItems.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type ApprovalAction = typeof approvalActions.$inferSelect;
