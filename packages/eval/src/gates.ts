import { type EvalGate, type EvalResult, type GateCheckResult, evalGateSchema } from './types.js';

export function defineGate(gate: EvalGate): EvalGate {
  return evalGateSchema.parse(gate);
}

/**
 * Check eval results against a list of gates. Returns a structured result with
 * any failure reasons. A gate fails when:
 *   - the suite has no result, or
 *   - score < minScore, or
 *   - regression vs baselineScore exceeds maxRegressionPct, or
 *   - requireAllCasesPass is true and any case failed.
 */
export function checkGates(
  results: readonly EvalResult[],
  gates: readonly EvalGate[],
): GateCheckResult {
  const byKey = new Map<string, EvalResult>();
  for (const r of results) {
    byKey.set(r.suiteKey, r);
  }

  const failures: string[] = [];
  for (const gate of gates) {
    const parsed = evalGateSchema.parse(gate);
    const result = byKey.get(parsed.suiteKey);
    if (!result) {
      failures.push(`gate ${parsed.suiteKey}: no eval result found`);
      continue;
    }

    if (result.score < parsed.minScore) {
      failures.push(
        `gate ${parsed.suiteKey}: score ${result.score.toFixed(4)} < minScore ${parsed.minScore}`,
      );
    }

    if (
      parsed.baselineScore !== undefined &&
      parsed.maxRegressionPct !== undefined &&
      parsed.baselineScore > 0
    ) {
      const regressionPct = ((parsed.baselineScore - result.score) / parsed.baselineScore) * 100;
      if (regressionPct > parsed.maxRegressionPct) {
        failures.push(
          `gate ${parsed.suiteKey}: regression ${regressionPct.toFixed(2)}% exceeds max ${parsed.maxRegressionPct}%`,
        );
      }
    }

    if (parsed.requireAllCasesPass && result.passedCases < result.totalCases) {
      failures.push(
        `gate ${parsed.suiteKey}: ${result.totalCases - result.passedCases} of ${result.totalCases} cases failed (requireAllCasesPass)`,
      );
    }
  }

  return { passed: failures.length === 0, failures };
}
