/**
 * Tests for RRF and HybridSearch.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HybridSearch, reciprocalRankFusion } from '../hybrid.js';
import { MeilisearchClient } from '../meilisearch-client.js';
import type { Logger } from '../types.js';
import { VectorSearch } from '../vector-search.js';

const logger: Logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('reciprocalRankFusion', () => {
  it('combines two lists with the canonical 1/(k+rank) formula', () => {
    const out = reciprocalRankFusion([
      [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      [{ id: 'b' }, { id: 'c' }, { id: 'a' }],
    ]);
    expect(out.length).toBe(3);
    expect(out[0]?.id).toBe('b');
    // a: 1/61 + 1/63; b: 1/61 + 1/62; c: 1/62 + 1/63
    const byId = Object.fromEntries(out.map((r) => [r.id, r.rrfScore]));
    expect(byId.b).toBeGreaterThan(byId.a ?? 0);
    expect(byId.b).toBeGreaterThan(byId.c ?? 0);
  });

  it('honors a custom k value', () => {
    const k = 5;
    const out = reciprocalRankFusion([[{ id: 'x' }], [{ id: 'x' }]], k);
    expect(out.length).toBe(1);
    expect(out[0]?.rrfScore).toBeCloseTo(2 / (k + 1), 9);
  });

  it('deduplicates and rewards items present in multiple lists', () => {
    const out = reciprocalRankFusion([
      [{ id: 'shared' }, { id: 'lex-only' }],
      [{ id: 'shared' }, { id: 'sem-only' }],
    ]);
    const shared = out.find((r) => r.id === 'shared');
    const lex = out.find((r) => r.id === 'lex-only');
    expect(shared).toBeDefined();
    expect(lex).toBeDefined();
    expect(shared?.rrfScore ?? 0).toBeGreaterThan(lex?.rrfScore ?? 0);
  });

  it('throws when k is invalid', () => {
    expect(() => reciprocalRankFusion([[{ id: 'a' }]], 0)).toThrow(/positive/);
    expect(() => reciprocalRankFusion([[{ id: 'a' }]], -1)).toThrow(/positive/);
    expect(() => reciprocalRankFusion([[{ id: 'a' }]], Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });

  it('returns an empty array when given no lists', () => {
    expect(reciprocalRankFusion([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// HybridSearch
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
  });
}

describe('HybridSearch.search', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('fuses lexical and semantic results with RRF', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        jsonResponse({
          hits: [
            { id: 'a', _rankingScore: 0.9, title: 'Alpha' },
            { id: 'b', _rankingScore: 0.8, title: 'Beta' },
          ],
          estimatedTotalHits: 2,
          processingTimeMs: 1,
          query: 'q',
        }),
      ),
    );
    const meili = new MeilisearchClient({ url: 'http://meili.test' });
    const db = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn().mockResolvedValue([
        { id: 'b', body: 'Beta body', distance: 0.1 },
        { id: 'c', body: 'Gamma body', distance: 0.2 },
      ]),
    };
    const vector = new VectorSearch({
      db: db as unknown as ConstructorParameters<typeof VectorSearch>[0]['db'],
      logger,
    });
    const hybrid = new HybridSearch({ meili, vector, logger });

    const out = await hybrid.search('ws-1', 'q', [0.1, 0.2], { limit: 10 });
    const ids = out.map((r) => r.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(ids).toContain('c');
    const b = out.find((r) => r.id === 'b');
    expect(b).toBeDefined();
    expect(b?.lexicalScore).toBe(0.8);
    expect(b?.semanticScore ?? 0).toBeGreaterThan(0);
    expect(b?.data.body).toBe('Beta body');
  });

  it('falls back to vector-only when Meilisearch fails', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('meili down')));
    const meili = new MeilisearchClient({ url: 'http://meili.test' });
    const db = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn().mockResolvedValue([{ id: 'x', body: 'x body', distance: 0.05 }]),
    };
    const vector = new VectorSearch({
      db: db as unknown as ConstructorParameters<typeof VectorSearch>[0]['db'],
      logger,
    });
    const hybrid = new HybridSearch({ meili, vector, logger });

    const out = await hybrid.search('ws-1', 'q', [0.1, 0.2]);
    expect(out.length).toBe(1);
    expect(out[0]?.id).toBe('x');
  });

  it('falls back to lexical-only when vector search fails', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        jsonResponse({
          hits: [{ id: 'lex1', _rankingScore: 1.0, body: 'lex body' }],
          estimatedTotalHits: 1,
          processingTimeMs: 1,
          query: 'q',
        }),
      ),
    );
    const meili = new MeilisearchClient({ url: 'http://meili.test' });
    const db = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn().mockRejectedValue(new Error('pg down')),
    };
    const vector = new VectorSearch({
      db: db as unknown as ConstructorParameters<typeof VectorSearch>[0]['db'],
      logger,
    });
    const hybrid = new HybridSearch({ meili, vector, logger });

    const out = await hybrid.search('ws-1', 'q', [0.1, 0.2]);
    expect(out.length).toBe(1);
    expect(out[0]?.id).toBe('lex1');
  });

  it('limits results to the requested limit', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        jsonResponse({
          hits: Array.from({ length: 5 }).map((_, i) => ({
            id: `l-${i}`,
            _rankingScore: 1 - i * 0.1,
          })),
          estimatedTotalHits: 5,
          processingTimeMs: 1,
          query: 'q',
        }),
      ),
    );
    const meili = new MeilisearchClient({ url: 'http://meili.test' });
    const db = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn().mockResolvedValue([]),
    };
    const vector = new VectorSearch({
      db: db as unknown as ConstructorParameters<typeof VectorSearch>[0]['db'],
      logger,
    });
    const hybrid = new HybridSearch({ meili, vector, logger });

    const out = await hybrid.search('ws-1', 'q', [0.1, 0.2], { limit: 3 });
    expect(out.length).toBe(3);
  });

  it('applies the reranker when rerank=true and a reranker is provided', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve(
        jsonResponse({
          hits: [
            { id: 'a', _rankingScore: 0.9, body: 'a body' },
            { id: 'b', _rankingScore: 0.7, body: 'b body' },
          ],
          estimatedTotalHits: 2,
          processingTimeMs: 1,
          query: 'q',
        }),
      ),
    );
    const meili = new MeilisearchClient({ url: 'http://meili.test' });
    const db = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn().mockResolvedValue([]),
    };
    const vector = new VectorSearch({
      db: db as unknown as ConstructorParameters<typeof VectorSearch>[0]['db'],
      logger,
    });
    const rerankSpy = vi.fn().mockResolvedValue([
      { id: 'b', score: 0.99, rank: 1 },
      { id: 'a', score: 0.5, rank: 2 },
    ]);
    const hybrid = new HybridSearch({
      meili,
      vector,
      logger,
      reranker: { rerank: rerankSpy },
    });

    const out = await hybrid.search('ws-1', 'q', [0.1, 0.2], { rerank: true });
    expect(out[0]?.id).toBe('b');
    expect(rerankSpy).toHaveBeenCalledOnce();
  });
});
