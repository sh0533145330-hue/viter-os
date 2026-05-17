/**
 * `@vita/ontology` — shared types and Zod schemas.
 *
 * Every public shape consumed by the extraction framework, linker,
 * lineage scribe, registry, and downstream tooling lives here.
 * Keep this module free of runtime imports beyond Zod so it can
 * be picked up by lightweight consumers.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sensitivity
// ---------------------------------------------------------------------------

export const SensitivitySchema = z.enum(['public', 'internal', 'confidential', 'restricted']);
export type Sensitivity = z.infer<typeof SensitivitySchema>;

// ---------------------------------------------------------------------------
// Scope reference (mirrors @vita/db ScopeRef)
// ---------------------------------------------------------------------------

export const ScopeRefSchema = z.object({
  scope: z.enum(['platform', 'agency', 'workspace', 'public', 'user', 'team']),
  scopeId: z.string().nullable(),
});
export type ScopeRef = z.infer<typeof ScopeRefSchema>;

// ---------------------------------------------------------------------------
// Entity reference — a mention of an entity in L1 text
// ---------------------------------------------------------------------------

export const EntityRefSchema = z.object({
  kind: z.string().describe('Object type key, e.g. "person", "org", "project"'),
  name: z.string().describe('Display name as found in source text'),
  attributes: z.record(z.string(), z.unknown()).optional(),
});
export type EntityRef = z.infer<typeof EntityRefSchema>;

// ---------------------------------------------------------------------------
// L0 Artifact — raw ingested artifact
// ---------------------------------------------------------------------------

export const L0ArtifactSchema = z.object({
  id: z.string().uuid(),
  sourceKind: z.string().describe('e.g. "email", "document", "transcript"'),
  mimeType: z.string(),
  body: z.string().describe('Raw text / content of the artifact'),
  metadata: z.record(z.string(), z.unknown()),
});
export type L0Artifact = z.infer<typeof L0ArtifactSchema>;

// ---------------------------------------------------------------------------
// L1 Extraction — structured output from an extractor
// ---------------------------------------------------------------------------

export const L1ExtractionSchema = z.object({
  kind: z.string().describe('Matches the extractor kind'),
  schemaVersion: z.number().int().positive().default(1),
  frontmatter: z.record(z.string(), z.unknown()),
  body: z.string().describe('Markdown body of the extraction'),
  entityReferences: z.array(EntityRefSchema),
  tags: z.array(z.string()),
  sensitivity: SensitivitySchema,
  piiTags: z.array(z.string()),
});
export type L1Extraction = z.infer<typeof L1ExtractionSchema>;

// ---------------------------------------------------------------------------
// Extractor context
// ---------------------------------------------------------------------------

export const ExtractorContextSchema = z.object({
  workspaceId: z.string().uuid(),
  // ModelProvider is a runtime interface, not serializable — use optional any
  modelProvider: z.any().optional(),
  logger: z.any().describe('Logger interface from @vita/agents'),
});
export type ExtractorContext = z.infer<typeof ExtractorContextSchema>;

// ---------------------------------------------------------------------------
// Logger contract (mirrors @vita/agents Logger)
// ---------------------------------------------------------------------------

export interface Logger {
  info(msg: string, data?: object): void;
  warn(msg: string, data?: object): void;
  error(msg: string, data?: object): void;
  debug?(msg: string, data?: object): void;
}

// ---------------------------------------------------------------------------
// ModelProvider contract (re-export friendly)
// ---------------------------------------------------------------------------

export interface ModelProvider {
  readonly name: string;
  send(req: {
    readonly model: string;
    readonly system: string;
    readonly messages: readonly { readonly role: string; readonly content: string }[];
    readonly maxTokens?: number;
    readonly temperature?: number;
  }): Promise<{
    readonly text?: string;
    readonly tokensIn: number;
    readonly tokensOut: number;
    readonly costCents: number;
    readonly model: string;
    readonly finishReason?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Db contract — we depend on the interface, not a hard import
// ---------------------------------------------------------------------------

export interface Db {
  insert(table: Record<string, unknown>): { values: (...rows: unknown[]) => { returning: () => Promise<unknown[]> }; onConflictDoNothing?: () => Promise<unknown[]> };
  select: (...args: unknown[]) => { from: (table: unknown) => { where: (cond: unknown) => Promise<unknown[]>; orderBy: (...cols: unknown[]) => { limit: (n: number) => Promise<unknown[]> } } };
  update(table: Record<string, unknown>): { set: (values: Record<string, unknown>) => { where: (cond: unknown) => Promise<unknown[]>; returning: () => Promise<unknown[]> } };
  delete(table: Record<string, unknown>): { where: (cond: unknown) => Promise<unknown[]> };
  execute: (sql: unknown) => Promise<unknown[]>;
}

// ---------------------------------------------------------------------------
// Entity linking result
// ---------------------------------------------------------------------------

export const LinkResultSchema = z.object({
  entityId: z.string().uuid(),
  objectTypeKey: z.string(),
  confidence: z.number().min(0).max(1),
  method: z.enum(['exact', 'fuzzy', 'llm']),
});
export type LinkResult = z.infer<typeof LinkResultSchema>;

// ---------------------------------------------------------------------------
// Action inference result
// ---------------------------------------------------------------------------

export const ActionInferenceResultSchema = z.object({
  actionKind: z.string().describe('e.g. "commitment", "request", "decision"'),
  description: z.string(),
  subjectEntity: EntityRefSchema.optional(),
  dueDate: z.string().optional(),
  confidence: z.number().min(0).max(1),
});
export type ActionInferenceResult = z.infer<typeof ActionInferenceResultSchema>;

// ---------------------------------------------------------------------------
// Conflict resolver result
// ---------------------------------------------------------------------------

export const ConflictResolutionSchema = z.object({
  resolution: z.enum(['merge', 'split', 'keep-latest', 'escalate']),
  chosenValue: z.unknown().optional(),
  rationale: z.string(),
  escalateToUserId: z.string().optional(),
});
export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;

// ---------------------------------------------------------------------------
// Lineage edge reference
// ---------------------------------------------------------------------------

export const LayerRefSchema = z.object({
  layer: z.string().describe('e.g. "l0", "l1", "l2"'),
  id: z.string().uuid(),
});
export type LayerRef = z.infer<typeof LayerRefSchema>;

// ---------------------------------------------------------------------------
// Embedding provider contract
// ---------------------------------------------------------------------------

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<Float32Array[]>;
}

// ---------------------------------------------------------------------------
// Object type definition — registry
// ---------------------------------------------------------------------------

export const PropertyDefSchema = z.object({
  type: z.string(),
  required: z.boolean().optional(),
  isTimeseries: z.boolean().optional(),
  isGeotime: z.boolean().optional(),
  validations: z.record(z.string(), z.unknown()).optional(),
});
export type PropertyDef = z.infer<typeof PropertyDefSchema>;

export const ObjectTypeDefinitionSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  properties: z.record(z.string(), PropertyDefSchema),
  vocabulary: z.record(z.string(), z.string()).optional(),
});
export type ObjectTypeDefinition = z.infer<typeof ObjectTypeDefinitionSchema>;

// ---------------------------------------------------------------------------
// Search index entry
// ---------------------------------------------------------------------------

export const SearchIndexEntrySchema = z.object({
  indexName: z.string(),
  id: z.string(),
  data: z.record(z.string(), z.unknown()),
  vectors: z.array(z.number()).optional(),
});
export type SearchIndexEntry = z.infer<typeof SearchIndexEntrySchema>;

// ---------------------------------------------------------------------------
// Derivation types
// ---------------------------------------------------------------------------

export const DerivationKindSchema = z.enum(['reextract', 'relink', 'rederive', 'rematerialize']);
export type DerivationKind = z.infer<typeof DerivationKindSchema>;

export const DerivationStatusSchema = z.enum(['queued', 'running', 'succeeded', 'failed']);
export type DerivationStatus = z.infer<typeof DerivationStatusSchema>;

export const DerivationScopeSchema = z.object({
  workspaceId: z.string().uuid(),
  layer: z.string().optional(),
  ids: z.array(z.string().uuid()).optional(),
});
export type DerivationScope = z.infer<typeof DerivationScopeSchema>;
