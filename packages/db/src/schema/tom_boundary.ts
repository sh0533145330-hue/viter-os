import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { boundaryActKindEnum, boundaryActStatusEnum } from '../enums.js';
import { approvals } from './inbox.js';
import { users, workspaces } from './tenancy.js';

export const tomBoundaryActs = pgTable(
  'tom_boundary_acts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    agentKey: text('agent_key').notNull().default('tom'),
    actKind: boundaryActKindEnum('act_kind').notNull(),
    target: text('target').notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    justification: text('justification'),
    autonomyLevel: text('autonomy_level').notNull().default('confirm'),
    approvalId: uuid('approval_id').references(() => approvals.id, { onDelete: 'set null' }),
    executedAt: timestamp('executed_at', { withTimezone: true }),
    status: boundaryActStatusEnum('status').notNull().default('pending'),
    error: jsonb('error'),
    correlationId: text('correlation_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('tom_boundary_acts_workspace_idx').on(t.workspaceId),
    userIdx: index('tom_boundary_acts_user_idx').on(t.userId),
    statusIdx: index('tom_boundary_acts_status_idx').on(t.workspaceId, t.status),
    executedAtIdx: index('tom_boundary_acts_executed_at_idx').on(t.workspaceId, t.executedAt),
    kindIdx: index('tom_boundary_acts_kind_idx').on(t.workspaceId, t.actKind),
  }),
);

export type TomBoundaryAct = typeof tomBoundaryActs.$inferSelect;
