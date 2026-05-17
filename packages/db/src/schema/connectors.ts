import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { connectorStatusEnum, stepStatusEnum } from '../enums.js';
import { users, workspaces } from './tenancy.js';

export const connectorInstances = pgTable(
  'connector_instances',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    provider: text('provider').notNull(),
    tier: text('tier').notNull().default('user'),
    credentialsRef: text('credentials_ref'),
    config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
    status: connectorStatusEnum('status').notNull().default('pending'),
    statusMessage: text('status_message'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('connector_instances_workspace_idx').on(t.workspaceId),
    providerIdx: index('connector_instances_provider_idx').on(t.workspaceId, t.provider),
    statusIdx: index('connector_instances_status_idx').on(t.workspaceId, t.status),
  }),
);

export const syncJobs = pgTable(
  'sync_jobs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    connectorInstanceId: uuid('connector_instance_id')
      .notNull()
      .references(() => connectorInstances.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    scheduleCron: text('schedule_cron'),
    status: text('status').notNull().default('idle'),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    config: jsonb('config').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    connectorIdx: index('sync_jobs_connector_idx').on(t.connectorInstanceId),
    nextRunIdx: index('sync_jobs_next_run_idx').on(t.nextRunAt),
  }),
);

export const syncRuns = pgTable(
  'sync_runs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    syncJobId: uuid('sync_job_id')
      .notNull()
      .references(() => syncJobs.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    status: stepStatusEnum('status').notNull().default('queued'),
    stats: jsonb('stats').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    jobIdx: index('sync_runs_job_idx').on(t.syncJobId, t.startedAt),
    statusIdx: index('sync_runs_status_idx').on(t.status),
  }),
);

export const syncErrors = pgTable(
  'sync_errors',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    syncRunId: uuid('sync_run_id')
      .notNull()
      .references(() => syncRuns.id, { onDelete: 'cascade' }),
    errorCode: text('error_code').notNull(),
    message: text('message').notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    runIdx: index('sync_errors_run_idx').on(t.syncRunId),
    codeIdx: index('sync_errors_code_idx').on(t.errorCode),
  }),
);

export type ConnectorInstance = typeof connectorInstances.$inferSelect;
export type SyncJob = typeof syncJobs.$inferSelect;
export type SyncRun = typeof syncRuns.$inferSelect;
export type SyncError = typeof syncErrors.$inferSelect;
