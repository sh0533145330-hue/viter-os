import { z } from 'zod';

export interface EvalContext {
  readonly suiteKey: string;
  readonly caseId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AssertionResult {
  readonly passed: boolean;
  readonly message?: string;
  readonly score?: number;
}

export type Assertion<TOutput> = (
  actual: TOutput,
  expected: TOutput | undefined,
  ctx: EvalContext,
) => AssertionResult;

export type Scorer<TOutput> = (actual: TOutput, expected: TOutput | undefined) => number;

export interface EvalCase<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly description?: string;
  readonly input: TInput;
  readonly expected?: TOutput;
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface EvalSuite<TInput = unknown, TOutput = unknown> {
  readonly key: string;
  readonly description: string;
  readonly cases: readonly EvalCase<TInput, TOutput>[];
  readonly runner: (input: TInput) => Promise<TOutput> | TOutput;
  readonly assertions?: readonly Assertion<TOutput>[];
  readonly scorer?: Scorer<TOutput>;
  readonly passingThreshold?: number;
}

export interface EvalCaseResult {
  readonly caseId: string;
  readonly passed: boolean;
  readonly actual: unknown;
  readonly expected?: unknown;
  readonly assertions: readonly AssertionResult[];
  readonly score: number;
  readonly durationMs: number;
  readonly error?: string;
  readonly tags?: readonly string[];
}

export interface EvalResult {
  readonly suiteKey: string;
  readonly passed: boolean;
  readonly totalCases: number;
  readonly passedCases: number;
  readonly score: number;
  readonly threshold: number;
  readonly durationMs: number;
  readonly cases: readonly EvalCaseResult[];
}

export interface Reporter {
  report(result: EvalResult): Promise<void> | void;
}

export interface RunEvalOptions {
  readonly parallel?: number;
  readonly stopOnFailure?: boolean;
  readonly reporter?: Reporter;
}

export const DEFAULT_PASSING_THRESHOLD = 0.85;

export const evalCaseSchema = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
  input: z.unknown(),
  expected: z.unknown().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const evalGateSchema = z.object({
  suiteKey: z.string().min(1),
  minScore: z.number().min(0).max(1),
  maxRegressionPct: z.number().min(0).max(100).optional(),
  baselineScore: z.number().min(0).max(1).optional(),
  requireAllCasesPass: z.boolean().optional(),
});

export type EvalGate = z.infer<typeof evalGateSchema>;

export interface GateCheckResult {
  readonly passed: boolean;
  readonly failures: readonly string[];
}
