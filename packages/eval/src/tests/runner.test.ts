import { describe, expect, it } from 'vitest';
import { assertions } from '../assertions.js';
import { defineEvalSuite, runEval } from '../runner.js';
import { exactMatch, jaccardSimilarity } from '../scoring.js';
import type { EvalCaseResult, EvalResult, Reporter } from '../types.js';

describe('defineEvalSuite', () => {
  it('returns the suite unchanged (identity helper)', () => {
    const suite = defineEvalSuite({
      key: 'sample',
      description: 'identity',
      cases: [{ id: 'c1', input: 1, expected: 1 }],
      runner: (n: number) => n,
    });
    expect(suite.key).toBe('sample');
  });
});

describe('runEval', () => {
  it('passes a suite where outputs exactly match expectations', async () => {
    const result = await runEval({
      key: 'echo',
      description: 'echo',
      cases: [
        { id: 'a', input: 'hi', expected: 'hi' },
        { id: 'b', input: 'bye', expected: 'bye' },
      ],
      runner: (s: string) => s,
    });
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
    expect(result.passedCases).toBe(2);
    expect(result.totalCases).toBe(2);
    expect(result.cases).toHaveLength(2);
  });

  it('fails the suite when scorer drops below threshold', async () => {
    const result = await runEval({
      key: 'half',
      description: 'half score',
      cases: [
        { id: 'a', input: 1, expected: 1 },
        { id: 'b', input: 2, expected: 2 },
        { id: 'c', input: 3, expected: 99 },
      ],
      runner: (n: number) => n,
      scorer: exactMatch,
      passingThreshold: 0.9,
    });
    expect(result.passed).toBe(false);
    expect(result.passedCases).toBe(2);
    expect(result.score).toBeCloseTo(2 / 3, 3);
  });

  it('uses a custom scorer to compute case scores', async () => {
    const result = await runEval({
      key: 'fuzzy',
      description: 'token-overlap',
      cases: [{ id: 'a', input: 'the cat sat', expected: 'the cat sat down' }],
      runner: (s: string) => s,
      scorer: (a, e) =>
        typeof a === 'string' && typeof e === 'string' ? jaccardSimilarity(a, e) : 0,
      passingThreshold: 0.5,
    });
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.passed).toBe(true);
  });

  it('applies assertions and surfaces failures', async () => {
    const result = await runEval({
      key: 'asserts',
      description: 'assertion DSL',
      cases: [{ id: 'a', input: 'hello world', expected: 'hello world' }],
      runner: (s: string) => s,
      assertions: [
        (actual) => assertions.contains('hello')(actual as string),
        (actual) => assertions.contains('GOODBYE')(actual as string),
      ],
    });
    expect(result.passed).toBe(false);
    const c = result.cases[0] as EvalCaseResult;
    expect(c.assertions).toHaveLength(2);
    expect(c.assertions[0]?.passed).toBe(true);
    expect(c.assertions[1]?.passed).toBe(false);
  });

  it('captures errors thrown by the runner', async () => {
    const result = await runEval({
      key: 'crash',
      description: 'errors',
      cases: [{ id: 'boom', input: null }],
      runner: () => {
        throw new Error('kaboom');
      },
    });
    expect(result.passed).toBe(false);
    const c = result.cases[0] as EvalCaseResult;
    expect(c.error).toBe('kaboom');
    expect(c.score).toBe(0);
  });

  it('respects parallel option (runs all cases)', async () => {
    const inputs = Array.from({ length: 8 }, (_, i) => i);
    const result = await runEval(
      {
        key: 'par',
        description: 'parallel',
        cases: inputs.map((i) => ({ id: `c${i}`, input: i, expected: i })),
        runner: async (n: number) => {
          await new Promise((r) => setTimeout(r, 5));
          return n;
        },
      },
      { parallel: 4 },
    );
    expect(result.totalCases).toBe(8);
    expect(result.passedCases).toBe(8);
  });

  it('honors stopOnFailure', async () => {
    const result = await runEval(
      {
        key: 'stop',
        description: 'stop early',
        cases: [
          { id: 'good', input: 1, expected: 1 },
          { id: 'bad', input: 2, expected: 99 },
          { id: 'never', input: 3, expected: 3 },
        ],
        runner: (n: number) => n,
      },
      { stopOnFailure: true },
    );
    expect(result.cases.length).toBeLessThan(3);
    expect(result.passed).toBe(false);
  });

  it('invokes reporter when provided', async () => {
    const captured: EvalResult[] = [];
    const reporter: Reporter = {
      report(r) {
        captured.push(r);
      },
    };
    await runEval(
      {
        key: 'rep',
        description: 'reporter',
        cases: [{ id: 'a', input: 1, expected: 1 }],
        runner: (n: number) => n,
      },
      { reporter },
    );
    expect(captured).toHaveLength(1);
    expect(captured[0]?.suiteKey).toBe('rep');
  });

  it('returns zero score and false for empty suite', async () => {
    const result = await runEval({
      key: 'empty',
      description: 'no cases',
      cases: [],
      runner: () => 'noop',
    });
    expect(result.totalCases).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it('preserves case tags and expected on the result', async () => {
    const result = await runEval({
      key: 'tags',
      description: 'tags propagate',
      cases: [{ id: 'a', input: 1, expected: 1, tags: ['smoke', 'core'] }],
      runner: (n: number) => n,
    });
    const c = result.cases[0] as EvalCaseResult;
    expect(c.tags).toEqual(['smoke', 'core']);
    expect(c.expected).toBe(1);
  });
});
