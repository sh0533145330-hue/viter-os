import { describe, expect, it } from 'vitest';
import {
  StubLlmJudge,
  bleuLite,
  clamp01,
  exactMatch,
  jaccardSimilarity,
  rougeLite,
} from '../scoring.js';

describe('exactMatch', () => {
  it('returns 1 for equal values', () => {
    expect(exactMatch('a', 'a')).toBe(1);
    expect(exactMatch({ a: 1 }, { a: 1 })).toBe(1);
  });
  it('returns 0 for unequal values', () => {
    expect(exactMatch('a', 'b')).toBe(0);
    expect(exactMatch({ a: 1 }, { a: 2 })).toBe(0);
  });
});

describe('bleuLite', () => {
  it('returns 1 for identical sentences', () => {
    const score = bleuLite('the cat sat on the mat', 'the cat sat on the mat');
    expect(score).toBeCloseTo(1, 3);
  });

  it('returns >0 for partial overlap', () => {
    const score = bleuLite('the cat sat on the mat', 'the cat sat on the rug');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('returns 0 for empty inputs', () => {
    expect(bleuLite('', 'something')).toBe(0);
    expect(bleuLite('something', '')).toBe(0);
  });

  it('handles disjoint vocabularies', () => {
    const score = bleuLite('alpha beta gamma delta', 'one two three four');
    expect(score).toBeLessThan(0.01);
  });
});

describe('rougeLite', () => {
  it('returns 1 for identical sentences', () => {
    expect(rougeLite('hello world foo bar', 'hello world foo bar')).toBeCloseTo(1, 3);
  });
  it('rewards recall over expected tokens', () => {
    const partial = rougeLite('hello world', 'hello world foo bar');
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(1);
  });
  it('returns 0 for disjoint tokens', () => {
    expect(rougeLite('alpha beta', 'gamma delta')).toBe(0);
  });
});

describe('jaccardSimilarity', () => {
  it('returns 1 for identical token sets', () => {
    expect(jaccardSimilarity('a b c', 'c b a')).toBe(1);
  });
  it('returns 0 for disjoint sets', () => {
    expect(jaccardSimilarity('a b', 'c d')).toBe(0);
  });
  it('returns intersection-over-union for overlap', () => {
    // tokens {a,b,c} vs {b,c,d} => intersect 2, union 4 => 0.5
    expect(jaccardSimilarity('a b c', 'b c d')).toBeCloseTo(0.5, 3);
  });
});

describe('StubLlmJudge', () => {
  const judge = new StubLlmJudge();

  it('returns 1.0 for exact string matches', async () => {
    expect(await judge.score('hello', 'hello', 'similarity')).toBe(1);
  });

  it('returns token-overlap score for similar strings', async () => {
    const score = await judge.score('hello world', 'hello there', 'similarity');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('falls back to exactMatch for non-strings', async () => {
    expect(await judge.score({ x: 1 }, { x: 1 }, 'eq')).toBe(1);
    expect(await judge.score({ x: 1 }, { x: 2 }, 'eq')).toBe(0);
  });
});

describe('clamp01', () => {
  it('clamps to [0,1]', () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0.3)).toBe(0.3);
    expect(clamp01(1.7)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});
