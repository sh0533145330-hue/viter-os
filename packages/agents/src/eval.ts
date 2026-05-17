/**
 * Per-agent eval hook.
 *
 * Each `AgentDefinition` may carry an `evalSuiteId` that resolves to a
 * suite authored via the engine eval runner. This module exposes a
 * thin registration surface so the prompt-versioning pipeline can hold
 * a single suite per agent key, look it up by id, and execute it
 * before promoting a new prompt revision.
 *
 * The structural shapes (`EvalCase`, `EvalSuite`, `EvalResult`) match
 * the contracts exported by `@vita/eval`; this module redeclares them
 * locally to avoid an extra cross-package dependency on the SDK.
 */

/** One scored row in an eval suite. */
export interface EvalCase<TInput = unknown, TExpected = unknown> {
  readonly name: string;
  readonly input: TInput;
  readonly expected?: TExpected;
  readonly tags?: readonly string[];
}

/** Outcome of running a single case. */
export interface EvalResult<TActual = unknown> {
  readonly caseName: string;
  readonly passed: boolean;
  readonly actual: TActual;
  readonly score?: number;
  readonly latencyMs: number;
  readonly error?: string;
}

/** A bundle of cases + the runner + an optional scorer. */
export interface EvalSuite<TInput = unknown, TActual = unknown, TExpected = unknown> {
  readonly name: string;
  readonly cases: readonly EvalCase<TInput, TExpected>[];
  readonly runner: (input: TInput) => Promise<TActual> | TActual;
  readonly scorer?: (actual: TActual, expected: TExpected | undefined) => boolean | number;
}

/** Identity helper that pins the suite's TS types after definition. */
export function defineEvalSuite<TInput, TActual, TExpected = unknown>(
  suite: EvalSuite<TInput, TActual, TExpected>,
): EvalSuite<TInput, TActual, TExpected> {
  return suite;
}

/** Run every case in a suite, returning per-case results. */
export async function runAgentEvalSuite<TInput, TActual, TExpected>(
  suite: EvalSuite<TInput, TActual, TExpected>,
): Promise<readonly EvalResult<TActual>[]> {
  const results: EvalResult<TActual>[] = [];
  for (const c of suite.cases) {
    const start = performance.now();
    try {
      const actual = await suite.runner(c.input);
      const passed = suite.scorer ? Boolean(suite.scorer(actual, c.expected)) : true;
      const latencyMs = performance.now() - start;
      const base = { caseName: c.name, passed, actual, latencyMs } as const;
      results.push(suite.scorer ? { ...base, score: passed ? 1 : 0 } : base);
    } catch (err) {
      results.push({
        caseName: c.name,
        passed: false,
        actual: undefined as TActual,
        latencyMs: performance.now() - start,
        error: (err as Error).message,
      });
    }
  }
  return results;
}

/** Lookup + storage for per-agent eval suites, keyed by suite id. */
export interface AgentEvalRegistry {
  register(suiteId: string, suite: EvalSuite): void;
  get(suiteId: string): EvalSuite | undefined;
  list(): readonly { id: string; suite: EvalSuite }[];
}

class InMemoryAgentEvalRegistry implements AgentEvalRegistry {
  private readonly suites = new Map<string, EvalSuite>();

  register(suiteId: string, suite: EvalSuite): void {
    this.suites.set(suiteId, suite);
  }

  get(suiteId: string): EvalSuite | undefined {
    return this.suites.get(suiteId);
  }

  list(): readonly { id: string; suite: EvalSuite }[] {
    return Array.from(this.suites.entries()).map(([id, suite]) => ({ id, suite }));
  }
}

/** Construct a new in-memory agent eval registry. */
export function createAgentEvalRegistry(): AgentEvalRegistry {
  return new InMemoryAgentEvalRegistry();
}
