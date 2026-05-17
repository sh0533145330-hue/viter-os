import { sql } from 'drizzle-orm';
import {
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
import { l0Artifacts } from './l0.js';
import { workspaces } from './tenancy.js';

export const l1Artifacts = pgTable(
  'l1_artifacts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    l0Id: uuid('l0_id').references(() => l0Artifacts.id, { onDelete: 'set null' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'restrict' }),
    kind: text('kind').notNull(),
    schemaVersion: integer('schema_version').notNull().default(1),
    extractor: text('extractor').notNull(),
    model: text('model'),
    promptHash: text('prompt_hash'),
    frontmatter: jsonb('frontmatter').notNull().default(sql`'{}'::jsonb`),
    body: text('body').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    sensitivity: sensitivityEnum('sensitivity').notNull().default('internal'),
    piiTags: text('pii_tags').array().notNull().default(sql`'{}'::text[]`),
    supersedesId: uuid('supersedes_id'),
    qualityScore: text('quality_score'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('l1_artifacts_workspace_idx').on(t.workspaceId),
    l0Idx: index('l1_artifacts_l0_idx').on(t.l0Id),
    kindIdx: index('l1_artifacts_kind_idx').on(t.workspaceId, t.kind),
    createdAtIdx: index('l1_artifacts_created_at_idx').on(t.workspaceId, t.createdAt),
    supersedesIdx: index('l1_artifacts_supersedes_idx').on(t.supersedesId),
  }),
);

export type L1Artifact = typeof l1Artifacts.$inferSelect;
