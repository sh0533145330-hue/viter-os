/**
 * Hybrid search — Reciprocal Rank Fusion of Meilisearch (BM25) and pgvector
 * cosine similarity. Results from multiple ranked lists are merged by RRF
 * and returned in fused order.
 */

import type { MeilisearchClient } from './meilisearch-client.js';
import type { HybridResult, HybridSearchOptions, LayerKind, Logger, Reranker } from './types.js';
import type { VectorSearch } from './vector-search.js';

const DEFAULT_RRF_K = 60;
const DEFAULT_LIMIT = 20;

export function reciprocalRankFusion<T extends { id: string }>(
  rankedLists: Array<T[]>,
  k: number = DEFAULT_RRF_K,
): Array<T & { rrfScore: number }> {
  if (!Number.isFinite(k) || k <= 0) {
    throw new Error('reciprocalRankFusion: k must be a positive finite number');
  }
  const scores = new Map<string, number>();
  const items = new Map<string, T>();

  for (const list of rankedLists) {
    list.forEach((item, idx) => {
      if (!item || typeof item.id !== 'string') return;
      const rank = idx + 1;
      const contribution = 1 / (k + rank);
      const prev = scores.get(item.id) ?? 0;
      scores.set(item.id, prev + contribution);
      if (!items.has(item.id)) items.set(item.id, item);
    });
  }

  return Array.from(scores.entries())
    .map(([id, score]) => {
      const original = items.get(id) as T;
      return { ...original, rrfScore: score };
    })
    .sort((a, b) => b.rrfScore - a.rrfScore);
}

export interface HybridSearchDeps {
  meili: MeilisearchClient;
  vector: VectorSearch;
  logger: Logger;
  reranker?: Reranker;
}

export class HybridSearch {
  private readonly meili: MeilisearchClient;
  private readonly vector: VectorSearch;
  private readonly logger: Logger;
  private readonly reranker: Reranker | undefined;

  constructor(deps: HybridSearchDeps) {
    this.meili = deps.meili;
    this.vector = deps.vector;
    this.logger = deps.logger;
    this.reranker = deps.reranker;
  }

  async search(
    workspaceId: string,
    query: string,
    queryVector: number[],
    opts: HybridSearchOptions = {},
  ): Promise<HybridResult[]> {
    const limit = opts.limit ?? DEFAULT_LIMIT;
    const k = opts.rrfK ?? DEFAULT_RRF_K;
    const indexName = `l1_artifacts_${workspaceId}`;

    const meiliPromise = this.meili
      .search(indexName, query, {
        limit: limit * 2,
        ...(opts.filter !== undefined ? { filter: opts.filter } : {}),
      })
      .catch((err) => {
        this.logger.warn('HybridSearch: meilisearch failed; falling back to vector-only', {
          error: String(err),
        });
        return null;
      });

    const vectorPromise = this.vector.searchL1(workspaceId, queryVector, limit * 2).catch((err) => {
      this.logger.warn('HybridSearch: vector search failed; falling back to lexical-only', {
        error: String(err),
      });
      return null;
    });

    const [meiliResp, vectorHits] = await Promise.all([meiliPromise, vectorPromise]);

    const lexical: Array<{ id: string; score: number; data: Record<string, unknown> }> = [];
    if (meiliResp) {
      for (const hit of meiliResp.hits) {
        const { _id, _score, ...rest } = hit;
        lexical.push({ id: _id, score: _score, data: rest });
      }
    }

    const semantic: Array<{
      id: string;
      score: number;
      data: Record<string, unknown>;
      layer: LayerKind;
    }> = [];
    if (vectorHits) {
      for (const hit of vectorHits) {
        semantic.push({ id: hit.id, score: hit.score, data: { body: hit.body }, layer: hit.layer });
      }
    }

    const fused = reciprocalRankFusion<{ id: string }>(
      [lexical.map((x) => ({ id: x.id })), semantic.map((x) => ({ id: x.id }))],
      k,
    );

    const lexicalById = new Map(lexical.map((x) => [x.id, x] as const));
    const semanticById = new Map(semantic.map((x) => [x.id, x] as const));

    const results: HybridResult[] = fused.map((item) => {
      const lex = lexicalById.get(item.id);
      const sem = semanticById.get(item.id);
      const data: Record<string, unknown> = { ...(lex?.data ?? {}), ...(sem?.data ?? {}) };
      const result: HybridResult = {
        id: item.id,
        layer: sem?.layer ?? 'l1',
        score: item.rrfScore,
        data,
      };
      if (lex !== undefined) result.lexicalScore = lex.score;
      if (sem !== undefined) result.semanticScore = sem.score;
      return result;
    });

    let limited = results.slice(0, limit);

    if (opts.rerank && this.reranker && limited.length > 1) {
      try {
        const candidates = limited.map((r) => ({
          id: r.id,
          text: typeof r.data.body === 'string' ? (r.data.body as string) : r.id,
          score: r.score,
        }));
        const reranked = await this.reranker.rerank(query, candidates);
        const byId = new Map(limited.map((r) => [r.id, r] as const));
        const ordered: HybridResult[] = [];
        for (const r of reranked) {
          const orig = byId.get(r.id);
          if (orig) ordered.push({ ...orig, score: r.score });
        }
        if (ordered.length > 0) limited = ordered;
      } catch (err) {
        this.logger.warn('HybridSearch: reranker failed; using RRF order', {
          error: String(err),
        });
      }
    }

    this.logger.debug?.('HybridSearch: returned results', {
      query,
      lexical: lexical.length,
      semantic: semantic.length,
      fused: limited.length,
    });

    return limited;
  }
}
