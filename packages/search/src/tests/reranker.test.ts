/**
 * Tests for cosineSimilarity, CosineReranker, and IdentityReranker.
 */

import { describe, expect, it, vi } from 'vitest';
import { CosineReranker, IdentityReranker, cosineSimilarity } from '../reranker.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 6);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 6);
  });

  it('handles zero vectors gracefully', () => {
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
  });
});

describe('CosineReranker', () => {
  it('reranks candidates by cosine similarity to the query', async () => {
    const embed = vi.fn().mockImplementation((texts: string[]) => {
      const vecs = texts.map((t) => {
        if (t === 'query') return new Float32Array([1, 0]);
        if (t === 'good') return new Float32Array([0.9, 0.1]);
        return new Float32Array([0, 1]);
      });
      return Promise.resolve(vecs);
    });
    const reranker = new CosineReranker({ embeddings: { embed } });
    const out = await reranker.rerank('query', [
      { id: 'bad', text: 'bad' },
      { id: 'good', text: 'good' },
    ]);
    expect(out[0]?.id).toBe('good');
    expect(out[0]?.rank).toBe(1);
    expect(out[1]?.id).toBe('bad');
  });

  it('returns an empty array for no candidates', async () => {
    const embed = vi.fn();
    const reranker = new CosineReranker({ embeddings: { embed } });
    expect(await reranker.rerank('q', [])).toEqual([]);
    expect(embed).not.toHaveBeenCalled();
  });
});

describe('IdentityReranker', () => {
  it('preserves input order', async () => {
    const reranker = new IdentityReranker();
    const out = await reranker.rerank('q', [
      { id: 'a', text: 'a' },
      { id: 'b', text: 'b' },
      { id: 'c', text: 'c' },
    ]);
    expect(out.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(out[0]?.rank).toBe(1);
  });
});
