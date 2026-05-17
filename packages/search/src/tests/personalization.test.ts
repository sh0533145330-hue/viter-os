/**
 * Tests for PersonalizationRanker.
 */

import { describe, expect, it } from 'vitest';
import { PersonalizationRanker, personalizeRanking } from '../personalization.js';

describe('personalizeRanking', () => {
  it('boosts items by topic preference', () => {
    const out = personalizeRanking(
      [
        { id: 'a', score: 0.5, data: { tags: ['finance'] } },
        { id: 'b', score: 0.6, data: { tags: ['unrelated'] } },
      ],
      { topics: { finance: 0.5 } },
    );
    expect(out[0]?.id).toBe('a');
  });

  it('boosts items by source affinity', () => {
    const out = personalizeRanking(
      [
        { id: 'a', score: 0.5, data: { source: 'email' } },
        { id: 'b', score: 0.5, data: { source: 'document' } },
      ],
      { sources: { email: 0.3 } },
    );
    expect(out[0]?.id).toBe('a');
  });

  it('applies recency boost based on updatedAt', () => {
    const now = Date.parse('2026-05-13T00:00:00.000Z');
    const recent = new Date(now - 1 * 86_400_000).toISOString();
    const old = new Date(now - 365 * 86_400_000).toISOString();
    const out = personalizeRanking(
      [
        { id: 'old', score: 0.6, data: { updatedAt: old } },
        { id: 'recent', score: 0.5, data: { updatedAt: recent } },
      ],
      { recencyBoost: 0.4 },
      { now },
    );
    expect(out[0]?.id).toBe('recent');
  });

  it('applies layer-specific boosts', () => {
    const out = personalizeRanking(
      [
        { id: 'a', score: 0.5, layer: 'l1', data: {} },
        { id: 'b', score: 0.5, layer: 'l2', data: {} },
      ],
      { layerBoost: { l2: 0.3 } },
    );
    expect(out[0]?.id).toBe('b');
  });

  it('PersonalizationRanker.apply is a thin wrapper around personalizeRanking', () => {
    const ranker = new PersonalizationRanker({ topics: { x: 1 } });
    const out = ranker.apply([
      { id: 'a', score: 0, data: { topic: 'x' } },
      { id: 'b', score: 0, data: { topic: 'y' } },
    ]);
    expect(out[0]?.id).toBe('a');
  });

  it('returns an empty array for empty input', () => {
    expect(personalizeRanking([], {})).toEqual([]);
  });
});
