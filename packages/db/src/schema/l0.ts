import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';
import { sensitivityEnum } from '../enums.js';
import { workspaces } from './tenancy.js';

export const l0Artifacts = pgTable(
  'l0_artifacts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    sourceKind: text('source_kind').notNull(),
    sourceUri: text('source_uri'),
    sourceConnectorInstanceId: uuid('source_connector_instance_id'),
    mimeType: text('mime_type').notNull(),
    sha256: text('sha256').notNull(),
    byteSize: bigint('byte_size', { mode: 'bigint' }).notNull(),
    storageBucket: text('storage_bucket').notNull(),
    storageKey: text('storage_key').notNull(),
    ingestedByUserId: uuid('ingested_by_user_id'),
    ingestedByAgent: text('ingested_by_agent'),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
    capturedAt: timestamp('captured_at', { withTimezone: true }),
    immutable: boolean('immutable').notNull().default(true),
    retentionUntil: timestamp('retention_until', { withTimezone: true }),
    sensitivity: sensitivityEnum('sensitivity').notNull().default('internal'),
    piiTags: text('pii_tags').array().notNull().default(sql`'{}'::text[]`),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('l0_artifacts_workspace_idx').on(t.workspaceId),
    sha256Idx: index('l0_artifacts_sha256_idx').on(t.workspaceId, t.sha256),
    sourceKindIdx: index('l0_artifacts_source_kind_idx').on(t.workspaceId, t.sourceKind),
    ingestedAtIdx: index('l0_artifacts_ingested_at_idx').on(t.workspaceId, t.ingestedAt),
  }),
);

export const l0Chunks = pgTable(
  'l0_chunks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    l0Id: uuid('l0_id')
      .notNull()
      .references(() => l0Artifacts.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    ordinal: integer('ordinal').notNull(),
    startOffset: integer('start_offset').notNull(),
    endOffset: integer('end_offset').notNull(),
    text: text('text').notNull(),
    tokenCount: integer('token_count'),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    l0Idx: index('l0_chunks_l0_idx').on(t.l0Id, t.ordinal),
    workspaceIdx: index('l0_chunks_workspace_idx').on(t.workspaceId),
  }),
);

export type L0Artifact = typeof l0Artifacts.$inferSelect;
export type L0Chunk = typeof l0Chunks.$inferSelect;
