/**
 * `@vita/pack-sdk` — shared types and Zod schemas for Knowledge Packs.
 *
 * Every public shape consumed by definePack, signing, publishing,
 * deployment, overlay, vocabulary, and dependency resolution lives
 * here. Keep this module free of runtime imports beyond Zod so it
 * can be picked up by lightweight consumers.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Logger contract (mirrors @vita/connector-sdk)
// ---------------------------------------------------------------------------

export interface Logger {
  info(msg: string, data?: object): void;
  warn(msg: string, data?: object): void;
  error(msg: string, data?: object): void;
  debug?(msg: string, data?: object): void;
}

// ---------------------------------------------------------------------------
// Db contract — injected, not hard-imported
// ---------------------------------------------------------------------------

export interface Db {
  insert(table: Record<string, unknown>): {
    values: (...rows: unknown[]) => { returning: () => Promise<unknown[]> };
    onConflictDoNothing?: () => Promise<unknown[]>;
  };
  select: (
    ...args: unknown[]
  ) => {
    from: (table: unknown) => {
      where: (cond: unknown) => Promise<unknown[]>;
      orderBy: (
        ...cols: unknown[]
      ) => { limit: (n: number) => Promise<unknown[]> };
    };
  };
  update(table: Record<string, unknown>): {
    set: (values: Record<string, unknown>) => {
      where: (cond: unknown) => Promise<unknown[]>;
      returning: () => Promise<unknown[]>;
    };
  };
  delete(table: Record<string, unknown>): {
    where: (cond: unknown) => Promise<unknown[]>;
  };
  execute: (sql: unknown) => Promise<unknown[]>;
}

// ---------------------------------------------------------------------------
// Literal types
// ---------------------------------------------------------------------------

export const PackItemKindSchema = z.enum([
  'object_type',
  'link_type',
  'action_type',
  'workflow',
  'agent',
  'skill',
  'eval_suite',
  'vocabulary',
]);
export type PackItemKind = z.infer<typeof PackItemKindSchema>;

// ---------------------------------------------------------------------------
// PackItem — a single library_items entry inside a pack
// ---------------------------------------------------------------------------

export const PackItemSchema = z.object({
  kind: PackItemKindSchema,
  key: z
    .string()
    .min(1)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Pack item key must be lowercase snake_case, starting with a letter',
    ),
  name: z.string().min(1),
  description: z.string().optional(),
  definition: z.record(z.string(), z.unknown()),
});
export type PackItem = z.infer<typeof PackItemSchema>;

// ---------------------------------------------------------------------------
// PackManifest — top-level pack definition
// ---------------------------------------------------------------------------

export const PackManifestSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'Pack key must be lowercase kebab-case, starting with a letter',
    ),
  name: z.string().min(1),
  description: z.string(),
  vertical: z.string().min(1),
  vendor: z.string().min(1),
  license: z.string().min(1),
  version: z.string().optional(),
  dependencies: z.record(z.string(), z.string()).default({}),
  items: z.array(PackItemSchema),
});
export type PackManifest = z.infer<typeof PackManifestSchema>;

// ---------------------------------------------------------------------------
// PackVersionManifest — versioned manifest stored in pack_versions.manifest
// ---------------------------------------------------------------------------

export const PackVersionManifestSchema = PackManifestSchema.extend({
  version: z.string().min(1),
  changelog: z.string().optional(),
  signature: z.string().optional(),
});
export type PackVersionManifest = z.infer<typeof PackVersionManifestSchema>;

// ---------------------------------------------------------------------------
// Publishing result
// ---------------------------------------------------------------------------

export const PublishResultSchema = z.object({
  packId: z.string().uuid(),
  packVersionId: z.string().uuid(),
  version: z.string(),
  signed: z.boolean(),
});
export type PublishResult = z.infer<typeof PublishResultSchema>;

// ---------------------------------------------------------------------------
// Dependency resolution
// ---------------------------------------------------------------------------

export const DepResolutionSchema = z.object({
  resolved: z.record(z.string(), z.string()),
  conflicts: z.array(z.string()),
  missing: z.array(z.string()),
});
export type DepResolution = z.infer<typeof DepResolutionSchema>;

// ---------------------------------------------------------------------------
// Deploy
// ---------------------------------------------------------------------------

export const DeployResultSchema = z.object({
  deploymentId: z.string().uuid(),
  status: z.enum(['success', 'failed']),
  overlaysApplied: z.number().int().nonnegative(),
});
export type DeployResult = z.infer<typeof DeployResultSchema>;

// ---------------------------------------------------------------------------
// Label override
// ---------------------------------------------------------------------------

export const LabelOverrideSchema = z.object({
  key: z.string(),
  labelSingular: z.string().optional(),
  labelPlural: z.string().optional(),
  locale: z.string().default('en-US'),
});
export type LabelOverride = z.infer<typeof LabelOverrideSchema>;
