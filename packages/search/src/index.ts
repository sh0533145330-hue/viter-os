/**
 * `@vita/search` — Hybrid search + answer engine.
 *
 * Wraps Meilisearch (lexical) and pgvector (semantic), fuses results via
 * Reciprocal Rank Fusion, optionally reranks via cross-encoder, and exposes
 * an answer engine that synthesizes LLM answers with citations and lineage.
 */

export type {
  ApiKeyOptions,
  ApiKeyResponse,
  AnswerRequest,
  AnswerResponse,
  Citation,
  Db,
  EmbeddingProvider,
  EntityVectorHit,
  HybridResult,
  HybridSearchOptions,
  IndexSettings,
  LayerKind,
  LineageBackwardEdge,
  LineageSource,
  LineageTrace,
  Logger,
  MeilisearchConfig,
  MeilisearchHit,
  ModelProvider,
  PackSynonyms,
  RerankCandidate,
  RerankResult,
  Reranker,
  SearchOptions,
  SearchResponse,
  UserPrefs,
  VectorHit,
} from './types.js';

export { MeilisearchClient } from './meilisearch-client.js';
export { VectorSearch, type VectorSearchDeps } from './vector-search.js';
export {
  HybridSearch,
  reciprocalRankFusion,
  type HybridSearchDeps,
} from './hybrid.js';
export {
  CosineReranker,
  IdentityReranker,
  cosineSimilarity,
  type CosineRerankerDeps,
} from './reranker.js';
export {
  AnswerEngine,
  type AnswerEngineDeps,
} from './answer-engine.js';
export {
  LineagePanel,
  type LineagePanelDeps,
} from './lineage-panel.js';
export {
  buildIndexSettings,
  expandQueryWithSynonyms,
} from './synonyms.js';
export {
  PersonalizationRanker,
  personalizeRanking,
  type PersonalizeOptions,
} from './personalization.js';
export {
  aggregateEval,
  mrr,
  ndcgAtK,
  precisionAtK,
  recallAtK,
  type EvalReport,
  type QueryEval,
} from './eval.js';

export const VERSION = '0.0.0';
