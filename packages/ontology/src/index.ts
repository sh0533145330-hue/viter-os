/**
 * `@vita/ontology` — Ontology pipeline.
 *
 * L0→L1 extraction, entity linking, action inference, conflict
 * resolution, lineage generation, embedding pipeline, ontology
 * registry CRUD, and search indexing helpers.
 */

// Types and Zod schemas
export type {
  Sensitivity,
  ScopeRef,
  EntityRef,
  L0Artifact,
  L1Extraction,
  ExtractorContext,
  Logger,
  ModelProvider,
  Db,
  LinkResult,
  ActionInferenceResult,
  ConflictResolution,
  LayerRef,
  EmbeddingProvider,
  ObjectTypeDefinition,
  PropertyDef,
  SearchIndexEntry,
  DerivationKind,
  DerivationStatus,
  DerivationScope,
} from './types.js';

export {
  SensitivitySchema,
  ScopeRefSchema,
  EntityRefSchema,
  L0ArtifactSchema,
  L1ExtractionSchema,
  ExtractorContextSchema,
  LinkResultSchema,
  ActionInferenceResultSchema,
  ConflictResolutionSchema,
  LayerRefSchema,
  ObjectTypeDefinitionSchema,
  PropertyDefSchema,
  SearchIndexEntrySchema,
  DerivationKindSchema,
  DerivationStatusSchema,
  DerivationScopeSchema,
} from './types.js';

// Extraction framework
export { ExtractionFramework, type Extractor } from './extractor.js';

// Extractors
export { EmailExtractor } from './extractors/email.js';
export { DocumentExtractor } from './extractors/document.js';
export { TranscriptExtractor } from './extractors/transcript.js';
export { ChatMessageExtractor } from './extractors/chat.js';
export { FinancialRecordExtractor } from './extractors/financial.js';
export { GenericExtractor } from './extractors/generic.js';

// Entity linker
export { EntityLinker, type EntityLinkerDeps } from './linker.js';

// Action inference
export { ActionInferenceAgent, type ActionInferenceDeps } from './action-inference.js';

// Conflict resolver
export {
  ConflictResolver,
  type ConflictingFact,
  type EntityConflicts,
  type ResolutionStrategy,
  type ConflictResolverDeps,
} from './conflict.js';

// Lineage scribe
export {
  LineageScribe,
  LINEAGE_KINDS,
  type LineageKind,
  type LineageScribeDeps,
  type LineageEdgeInput,
} from './lineage.js';

// Embedding pipeline
export {
  EmbeddingPipeline,
  MockEmbeddingProvider,
  type EmbeddingPipelineDeps,
  type EmbedItem,
} from './embedding.js';

// Ontology registry
export { OntologyRegistry, type OntologyRegistryDeps } from './registry.js';

// Search indexer
export { SearchIndexer, type SearchIndexerDeps } from './search.js';

// Derivation runner
export { DerivationRunner, type DerivationRunnerDeps } from './derivation.js';

export const VERSION = '0.0.0';
