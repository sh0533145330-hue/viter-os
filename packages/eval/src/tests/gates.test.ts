import { describe, expect, it } from 'vitest';
import { checkGates, defineGate } from '../gates.js';
import type { EvalResult } from '../types.js';

function mkResult(
  suiteKey: string,
  score: number,
  opts: { totalCases?: number; passedCases?: number } = {},
): EvalResult {
  const total = opts.totalCases ?? 1;
  const passed = opts.passedCases ?? total;
  return {
    suiteKey,
    passed: score >= 0.85 && passed === total,
    totalCases: total,
    passedCases: passed,
    score,
    threshold: 0.85,
    durationMs: 1,
    cases: [],
  };
}

describe('defineGate', () => {
  it('validates and returns gate config', () => {
    const g = defineGate({ suiteKey: 's1', minScore: 0.9 });
    expect(g.suiteKey).toBe('s1');
    expect(g.minScore).toBe(0.9);
  });
  it('rejects out-of-range thresholds', () => {
    expect(() => defineGate({ suiteKey: 's1', minScore: 1.5 })).toThrow();
  });
});

describe('checkGates', () => {
  it('passes when score meets minScore', () => {
    const r = mkResult('agent.tom', 0.92);
    const out = checkGates([r], [{ suiteKey: 'agent.tom', minScore: 0.9 }]);
    expect(out.passed).toBe(true);
    expect(out.failures).toHaveLength(0);
  });

  it('fails when score below minScore', () => {
    const r = mkResult('agent.tom', 0.7);
    const out = checkGates([r], [{ suiteKey: 'agent.tom', minScore: 0.9 }]);
    expect(out.passed).toBe(false);
    expect(out.failures[0]).toContain('minScore');
  });

  it('reports missing suite results', () => {
    const out = checkGates([], [{ suiteKey: 'agent.ghost', minScore: 0.9 }]);
    expect(out.passed).toBe(false);
    expect(out.failures[0]).toContain('no eval result');
  });

  it('detects regression vs baseline', () => {
    const r = mkResult('agent.tom', 0.88);
    const out = checkGates(
      [r],
      [{ suiteKey: 'agent.tom', minScore: 0.8, baselineScore: 0.95, maxRegressionPct: 2 }],
    );
    expect(out.passed).toBe(false);
    expect(out.failures[0]).toContain('regression');
  });

  it('passes when regression within tolerance', () => {
    const r = mkResult('agent.tom', 0.94);
    const out = checkGates(
      [r],
      [{ suiteKey: 'agent.tom', minScore: 0.8, baselineScore: 0.95, maxRegressionPct: 2 }],
    );
    expect(out.passed).toBe(true);
  });

  it('honors requireAllCasesPass', () => {
    const r = mkResult('agent.tom', 0.95, { totalCases: 10, passedCases: 9 });
    const out = checkGates(
      [r],
      [{ suiteKey: 'agent.tom', minScore: 0.8, requireAllCasesPass: true }],
    );
    expect(out.passed).toBe(false);
    expect(out.failures[0]).toContain('requireAllCasesPass');
  });

  it('aggregates failures across gates', () => {
    const results: EvalResult[] = [mkResult('a', 0.5), mkResult('b', 0.95)];
    const out = checkGates(results, [
      { suiteKey: 'a', minScore: 0.9 },
      { suiteKey: 'b', minScore: 0.9 },
      { suiteKey: 'c', minScore: 0.9 },
    ]);
    expect(out.passed).toBe(false);
    expect(out.failures).toHaveLength(2);
  });
});
