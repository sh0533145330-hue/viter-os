import { clamp01, exactMatch } from './scoring.js';
import {
  type AssertionResult,
  DEFAULT_PASSING_THRESHOLD,
  type EvalCaseResult,
  type EvalContext,
  type EvalResult,
  type EvalSuite,
  type RunEvalOptions,
} from './types.js';

export function defineEvalSuite<TInput, TOutput>(
  suite: EvalSuite<TInput, TOutput>,
): EvalSuite<TInput, TOutput> {
  return suite;
}

interface CaseExecution<_TOutput> {
  readonly result: EvalCaseResult;
  readonly assertionFailures: number;
}

async function runCase<TInput, TOutput>(
  suite: EvalSuite<TInput, TOutput>,
  c: EvalSuite<TInput, TOutput>['cases'][number],
): Promise<CaseExecution<TOutput>> {
  const start = performance.now();
  const ctx: EvalContext = c.metadata
    ? { suiteKey: suite.key, caseId: c.id, metadata: c.metadata }
    : { suiteKey: suite.key, caseId: c.id };

  try {
    const actual = await suite.runner(c.input);
    const assertions: AssertionResult[] = [];
    let assertionFailures = 0;

    if (suite.assertions) {
      for (const assertion of suite.assertions) {
        const r = assertion(actual, c.expected, ctx);
        assertions.push(r);
        if (!r.passed) assertionFailures++;
      }
    }

    const rawScore = suite.scorer
      ? suite.scorer(actual, c.expected)
      : c.expected !== undefined
        ? exactMatch(actual, c.expected)
        : 1;
    const score = clamp01(rawScore);
    const threshold = suite.passingThreshold ?? DEFAULT_PASSING_THRESHOLD;
    const passed = assertionFailures === 0 && score >= threshold;

    const base: {
      caseId: string;
      passed: boolean;
      actual: unknown;
      assertions: readonly AssertionResult[];
      score: number;
      durationMs: number;
    } = {
      caseId: c.id,
      passed,
      actual,
      assertions,
      score,
      durationMs: performance.now() - start,
    };

    const withOptionals: EvalCaseResult = {
      ...base,
      ...(c.expected !== undefined ? { expected: c.expected } : {}),
      ...(c.tags ? { tags: c.tags } : {}),
    };

    return { result: withOptionals, assertionFailures };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errorResult: EvalCaseResult = {
      caseId: c.id,
      passed: false,
      actual: undefined,
      assertions: [],
      score: 0,
      durationMs: performance.now() - start,
      error: message,
      ...(c.expected !== undefined ? { expected: c.expected } : {}),
      ...(c.tags ? { tags: c.tags } : {}),
    };
    return { result: errorResult, assertionFailures: 1 };
  }
}

async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  onResult?: (r: R) => boolean | undefined,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  let stopRequested = false;

  const workers: Promise<void>[] = [];
  const workerCount = Math.max(1, Math.min(limit, items.length));

  for (let w = 0; w < workerCount; w++) {
    workers.push(
      (async () => {
        while (!stopRequested) {
          const i = cursor++;
          if (i >= items.length) return;
          const item = items[i];
          if (item === undefined) continue;
          const r = await fn(item, i);
          results[i] = r;
          if (onResult && onResult(r) === true) {
            stopRequested = true;
            return;
          }
        }
      })(),
    );
  }
  await Promise.all(workers);

  return results.filter((r): r is R => r !== undefined);
}

export async function runEval<TInput, TOutput>(
  suite: EvalSuite<TInput, TOutput>,
  options: RunEvalOptions = {},
): Promise<EvalResult> {
  const start = performance.now();
  const threshold = suite.passingThreshold ?? DEFAULT_PASSING_THRESHOLD;
  const parallel = Math.max(1, options.parallel ?? 1);
  const stopOnFailure = options.stopOnFailure ?? false;

  const executions = await runWithConcurrency(
    suite.cases,
    parallel,
    (c) => runCase(suite, c),
    (exec) => (stopOnFailure && !exec.result.passed ? true : undefined),
  );

  const cases = executions.map((e) => e.result);
  const totalCases = cases.length;
  const passedCases = cases.filter((c) => c.passed).length;
  const score = totalCases === 0 ? 0 : cases.reduce((acc, c) => acc + c.score, 0) / totalCases;
  const allAssertionsPassed = cases.every((c) => c.assertions.every((a) => a.passed));
  const passed = totalCases > 0 && score >= threshold && allAssertionsPassed;

  const result: EvalResult = {
    suiteKey: suite.key,
    passed,
    totalCases,
    passedCases,
    score,
    threshold,
    durationMs: performance.now() - start,
    cases,
  };

  if (options.reporter) {
    await options.reporter.report(result);
  }

  return result;
}
