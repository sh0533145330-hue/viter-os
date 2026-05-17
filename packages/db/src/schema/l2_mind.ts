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
import { mindKindEnum, mindProposalStatusEnum } from '../enums.js';
import { users, workspaces } from './tenancy.js';

export const tomMinds = pgTable(
  'tom_minds',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    stateVersion: integer('state_version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userWorkspaceUnique: uniqueIndex('tom_minds_user_workspace_uq').on(t.userId, t.workspaceId),
    workspaceIdx: index('tom_minds_workspace_idx').on(t.workspaceId),
  }),
);

export const timMinds = pgTable(
  'tim_minds',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    stateVersion: integer('state_version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceUnique: uniqueIndex('tim_minds_workspace_uq').on(t.workspaceId),
  }),
);

export const mindItems = pgTable(
  'mind_items',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    mindId: uuid('mind_id').notNull(),
    mindKind: mindKindEnum('mind_kind').notNull(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    section: text('section').notNull(),
    key: text('key').notNull(),
    value: jsonb('value').notNull().default(sql`'{}'::jsonb`),
    confidence: numeric('confidence'),
    source: jsonb('source').notNull().default(sql`'{}'::jsonb`),
    version: integer('version').notNull().default(1),
    parentId: uuid('parent_id'),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validTo: timestamp('valid_to', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    mindIdx: index('mind_items_mind_idx').on(t.mindId, t.mindKind),
    workspaceIdx: index('mind_items_workspace_idx').on(t.workspaceId),
    sectionIdx: index('mind_items_section_idx').on(t.mindId, t.section),
    parentIdx: index('mind_items_parent_idx').on(t.parentId),
  }),
);

export const mindProposals = pgTable(
  'mind_proposals',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    mindId: uuid('mind_id').notNull(),
    mindKind: mindKindEnum('mind_kind').notNull(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    proposedChange: jsonb('proposed_change').notNull(),
    source: jsonb('source').notNull().default(sql`'{}'::jsonb`),
    status: mindProposalStatusEnum('status').notNull().default('pending'),
    rationale: text('rationale'),
    decidedBy: uuid('decided_by').references(() => users.id, { onDelete: 'set null' }),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    mindIdx: index('mind_proposals_mind_idx').on(t.mindId, t.mindKind),
    statusIdx: index('mind_proposals_status_idx').on(t.workspaceId, t.status),
  }),
);

export const mindEvents = pgTable(
  'mind_events',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    mindId: uuid('mind_id').notNull(),
    mindKind: mindKindEnum('mind_kind').notNull(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    eventKind: text('event_kind').notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    actorAgent: text('actor_agent'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    mindIdx: index('mind_events_mind_idx').on(t.mindId, t.mindKind),
    occurredAtIdx: index('mind_events_occurred_at_idx').on(t.workspaceId, t.occurredAt),
  }),
);

export type TomMind = typeof tomMinds.$inferSelect;
export type TimMind = typeof timMinds.$inferSelect;
export type MindItem = typeof mindItems.$inferSelect;
export type MindProposal = typeof mindProposals.$inferSelect;
export type MindEvent = typeof mindEvents.$inferSelect;
