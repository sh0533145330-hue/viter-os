/**
 * Reranker — cross-encoder-style reranking of candidate results.
 *
 * Includes a simple cosine-similarity-based reranker that works against a
 * provided `EmbeddingProvider`. Production deployments can swap in a Cohere
 * or local MiniLM reranker by implementing the `Reranker` interface.
 */

import type {
  EmbeddingProvider,
  Logger,
  RerankCandidate,
  RerankResult,
  Reranker,
} from './types.js';

export type { RerankCandidate, RerankResult, Reranker } from './types.js';

export function cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

export interface CosineRerankerDeps {
  embeddings: EmbeddingProvider;
  logger?: Logger;
}

/**
 * Cosine-similarity reranker. Embeds the query and every candidate text,
 * then scores by cosine similarity. Suitable for tests and offline runs;
 * for production prefer a true cross-encoder.
 */
export class CosineReranker implements Reranker {
  private readonly embeddings: EmbeddingProvider;
  private readonly logger: Logger | undefined;

  constructor(deps: CosineRerankerDeps) {
    this.embeddings = deps.embeddings;
    this.logger = deps.logger;
  }

  async rerank(query: string, candidates: RerankCandidate[]): Promise<RerankResult[]> {
    if (candidates.length === 0) return [];

    const texts = [query, ...candidates.map((c) => c.text)];
    const vectors = await this.embeddings.embed(texts);
    const queryVec = vectors[0];
    if (!queryVec) {
      this.logger?.warn?.('CosineReranker: failed to embed query');
      return candidates.map((c, i) => ({ id: c.id, score: c.score ?? 0, rank: i + 1 }));
    }

    const scored = candidates.map((c, i) => {
      const v = vectors[i + 1];
      const score = v ? cosineSimilarity(queryVec, v) : 0;
      return { id: c.id, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s, idx) => ({ id: s.id, score: s.score, rank: idx + 1 }));
  }
}

/**
 * Identity reranker — preserves the input order; useful for tests and as
 * a default when no reranker is configured.
 */
export class IdentityReranker implements Reranker {
  async rerank(_query: string, candidates: RerankCandidate[]): Promise<RerankResult[]> {
    return candidates.map((c, idx) => ({
      id: c.id,
      score: c.score ?? 1 - idx * 0.01,
      rank: idx + 1,
    }));
  }
}
