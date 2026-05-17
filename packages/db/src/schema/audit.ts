import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  inet,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { actorKindEnum, costMeterKindEnum } from '../enums.js';
import { connectorInstances } from './connectors.js';
import { workspaces } from './tenancy.js';

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').notNull().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id').notNull(),
    actorKind: actorKindEnum('actor_kind').notNull(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull(),
    resource: text('resource').notNull(),
    resourceId: uuid('resource_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    diff: jsonb('diff'),
    ip: inet('ip'),
    ua: text('ua'),
    requestId: text('request_id'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('audit_log_workspace_idx').on(t.workspaceId, t.at),
    actorIdx: index('audit_log_actor_idx').on(t.workspaceId, t.actorKind, t.actorId),
    resourceIdx: index('audit_log_resource_idx').on(t.workspaceId, t.resource, t.resourceId),
    actionIdx: index('audit_log_action_idx').on(t.workspaceId, t.action),
  }),
);

export const costMeters = pgTable(
  'cost_meters',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    meterKind: costMeterKindEnum('meter_kind').notNull(),
    period: text('period').notNull(),
    units: numeric('units').notNull().default('0'),
    costCents: integer('cost_cents').notNull().default(0),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('cost_meters_workspace_idx').on(t.workspaceId),
    periodIdx: index('cost_meters_period_idx').on(t.workspaceId, t.meterKind, t.period),
  }),
);

export const sourceHealth = pgTable(
  'source_health',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    connectorInstanceId: uuid('connector_instance_id')
      .notNull()
      .references(() => connectorInstances.id, { onDelete: 'cascade' }),
    period: text('period').notNull(),
    heartbeatAt: timestamp('heartbeat_at', { withTimezone: true }),
    errorRate: numeric('error_rate'),
    schemaDrift: boolean('schema_drift').notNull().default(false),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    connectorIdx: index('source_health_connector_idx').on(t.connectorInstanceId, t.period),
  }),
);

export type AuditLog = typeof auditLog.$inferSelect;
export type CostMeter = typeof costMeters.$inferSelect;
export type SourceHealth = typeof sourceHealth.$inferSelect;
