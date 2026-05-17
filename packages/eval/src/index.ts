export type {
  Assertion,
  AssertionResult,
  EvalCase,
  EvalCaseResult,
  EvalContext,
  EvalGate,
  EvalResult,
  EvalSuite,
  GateCheckResult,
  Reporter,
  RunEvalOptions,
  Scorer,
} from './types.js';
export {
  DEFAULT_PASSING_THRESHOLD,
  evalCaseSchema,
  evalGateSchema,
} from './types.js';

export { defineEvalSuite, runEval } from './runner.js';
export { assertions, deepEqual } from './assertions.js';
export {
  bleuLite,
  clamp01,
  exactMatch,
  jaccardSimilarity,
  rougeLite,
  StubLlmJudge,
  type LlmJudge,
} from './scoring.js';
export { GoldenSetLoader, type GoldenFile, type LoadOptions } from './golden.js';
export { checkGates, defineGate } from './gates.js';
export { ConsoleReporter, type ConsoleReporterOptions } from './reporters/console.js';
export { JsonReporter, type JsonReporterOptions } from './reporters/json.js';
export { JunitReporter, type JunitReporterOptions } from './reporters/junit.js';

export const VERSION = '0.1.0';
