/**
 * Tests for search eval metrics.
 */

import { describe, expect, it } from 'vitest';
import { aggregateEval, mrr, ndcgAtK, precisionAtK, recallAtK } from '../eval.js';

describe('ndcgAtK', () => {
  it('returns 1 when the actual ranking matches the ideal ranking', () => {
    const ideal = ['a', 'b', 'c', 'd'];
    expect(ndcgAtK(ideal, ideal, 4)).toBeCloseTo(1, 6);
  });

  it('returns < 1 when the actual order differs', () => {
    const ideal = ['a', 'b', 'c', 'd'];
    const actual = ['b', 'a', 'd', 'c'];
    const score = ndcgAtK(actual, ideal, 4);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('returns 0 when no relevant items appear', () => {
    expect(ndcgAtK(['x', 'y'], ['a', 'b'], 10)).toBe(0);
  });

  it('returns 0 when ideal is empty', () => {
    expect(ndcgAtK(['a'], [], 10)).toBe(0);
  });

  it('handles k larger than list length', () => {
    const ideal = ['a', 'b'];
    expect(ndcgAtK(ideal, ideal, 100)).toBeCloseTo(1, 6);
  });
});

describe('recallAtK', () => {
  it('returns 1 when all relevant items are retrieved within k', () => {
    expect(recallAtK(['a', 'b', 'c'], ['a', 'c'], 3)).toBeCloseTo(1, 6);
  });

  it('returns the correct fraction when only some are retrieved', () => {
    expect(recallAtK(['a', 'x', 'y'], ['a', 'b'], 3)).toBeCloseTo(0.5, 6);
  });

  it('returns 0 when no relevant items in top-k', () => {
    expect(recallAtK(['x', 'y'], ['a'], 2)).toBe(0);
  });

  it('returns 0 for empty relevant set', () => {
    expect(recallAtK(['a'], [], 5)).toBe(0);
  });
});

describe('precisionAtK', () => {
  it('returns the fraction of top-k that are relevant', () => {
    expect(precisionAtK(['a', 'b', 'x', 'y'], ['a', 'b'], 2)).toBeCloseTo(1, 6);
    expect(precisionAtK(['a', 'b', 'x', 'y'], ['a', 'b'], 4)).toBeCloseTo(0.5, 6);
  });

  it('returns 0 when nothing is relevant', () => {
    expect(precisionAtK(['a', 'b'], ['c'], 2)).toBe(0);
  });

  it('returns 0 for empty actual', () => {
    expect(precisionAtK([], ['a'], 5)).toBe(0);
  });
});

describe('mrr', () => {
  it('averages 1/rank across queries', () => {
    expect(mrr([1, 2, 4])).toBeCloseTo((1 + 1 / 2 + 1 / 4) / 3, 6);
  });

  it('treats 0 as no relevant hit', () => {
    expect(mrr([0, 0])).toBe(0);
  });

  it('returns 0 for empty list', () => {
    expect(mrr([])).toBe(0);
  });
});

describe('aggregateEval', () => {
  it('returns zeros for an empty batch', () => {
    expect(aggregateEval([])).toEqual({
      ndcg10: 0,
      recall10: 0,
      precision10: 0,
      mrr: 0,
      queryCount: 0,
    });
  });

  it('aggregates across queries', () => {
    const report = aggregateEval([
      { actual: ['a', 'b'], relevant: ['a'] },
      { actual: ['x', 'a'], relevant: ['a'] },
    ]);
    expect(report.queryCount).toBe(2);
    expect(report.recall10).toBeGreaterThan(0);
    expect(report.mrr).toBeGreaterThan(0);
    expect(report.mrr).toBeCloseTo((1 + 1 / 2) / 2, 6);
  });

  it('uses ideal ordering when supplied', () => {
    const report = aggregateEval([{ actual: ['a', 'b'], relevant: ['a', 'b'], ideal: ['a', 'b'] }]);
    expect(report.ndcg10).toBeCloseTo(1, 6);
  });
});
