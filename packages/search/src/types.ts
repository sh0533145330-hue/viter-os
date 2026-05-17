export type { Db, EmbeddingProvider, Logger, ModelProvider } from '@vita/ontology';

// ---------------------------------------------------------------------------
// Layer identifiers
// ---------------------------------------------------------------------------

export type LayerKind = 'l0' | 'l1' | 'l2' | 'l3' | 'l4';

// ---------------------------------------------------------------------------
// Meilisearch surface
// ---------------------------------------------------------------------------

export interface MeilisearchConfig {
  url: string;
  apiKey?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filter?: string;
  sort?: string[];
  attributesToHighlight?: string[];
  attributesToRetrieve?: string[];
}

export interface MeilisearchHit {
  _id: string;
  _score: number;
  [key: string]: unknown;
}

export interface SearchResponse {
  hits: MeilisearchHit[];
  estimatedTotalHits: number;
  processingTimeMs: number;
  query: string;
}

export interface IndexSettings {
  searchableAttributes?: string[];
  filterableAttributes?: string[];
  sortableAttributes?: string[];
  rankingRules?: string[];
  stopWords?: string[];
  synonyms?: Record<string, string[]>;
  typoTolerance?: {
    enabled?: boolean;
    minWordSizeForTypos?: { oneTypo?: number; twoTypos?: number };
    disableOnWords?: string[];
    disableOnAttributes?: string[];
  };
}

export interface ApiKeyOptions {
  description: string;
  indexes: string[];
  actions: string[];
  expiresAt?: Date;
}

export interface ApiKeyResponse {
  key: string;
  uid: string;
}

// ---------------------------------------------------------------------------
// Vector search
// ---------------------------------------------------------------------------

export interface VectorHit {
  id: string;
  score: number;
  body: string;
  layer: LayerKind;
  metadata?: Record<string, unknown>;
}

export interface EntityVectorHit {
  id: string;
  score: number;
  name: string;
  kind?: string;
}

// ---------------------------------------------------------------------------
// Hybrid search
// ---------------------------------------------------------------------------

export interface HybridResult {
  id: string;
  layer: LayerKind;
  score: number;
  lexicalScore?: number;
  semanticScore?: number;
  data: Record<string, unknown>;
}

export interface HybridSearchOptions {
  limit?: number;
  rrfK?: number;
  filter?: string;
  rerank?: boolean;
}

// ---------------------------------------------------------------------------
// Reranker
// ---------------------------------------------------------------------------

export interface RerankCandidate {
  id: string;
  text: string;
  score?: number;
}

export interface RerankResult {
  id: string;
  score: number;
  rank: number;
}

export interface Reranker {
  rerank(query: string, candidates: RerankCandidate[]): Promise<RerankResult[]>;
}

// ---------------------------------------------------------------------------
// Answer engine
// ---------------------------------------------------------------------------

export interface AnswerRequest {
  workspaceId: string;
  query: string;
  queryVector?: number[];
  userPrefs?: Record<string, unknown>;
  maxSources?: number;
  conversationId?: string;
  userId?: string;
}

export interface Citation {
  sourceId: string;
  sourceLayer: 'l0' | 'l1' | 'l2';
  quote?: string;
  relevance: number;
}

export interface AnswerResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
  tokens: { in: number; out: number };
  costCents: number;
  latencyMs: number;
  sources: HybridResult[];
}

// ---------------------------------------------------------------------------
// Lineage panel
// ---------------------------------------------------------------------------

export interface LineageBackwardEdge {
  layer: string;
  id: string;
  kind: string;
}

export interface LineageSource {
  id: string;
  layer: 'l0' | 'l1' | 'l2';
  relevance: number;
  excerpt: string;
  lineageBackward: LineageBackwardEdge[];
}

export interface LineageTrace {
  answerId: string;
  query: string;
  sources: LineageSource[];
  reasoning?: string;
}

// ---------------------------------------------------------------------------
// Synonyms / personalization
// ---------------------------------------------------------------------------

export interface PackSynonyms {
  packKey: string;
  synonyms: Record<string, string[]>;
  rankingRules?: string[];
  stopWords?: string[];
  typoTolerance?: IndexSettings['typoTolerance'];
}

export interface UserPrefs {
  topics?: Record<string, number>;
  sources?: Record<string, number>;
  recencyBoost?: number;
  layerBoost?: Partial<Record<LayerKind, number>>;
}
