/**
 * Agent authoring primitive.
 *
 * Every agent on the platform — Tom, Tim, Deny, the librarians, and
 * any community-authored agent — is declared through {@link defineAgent}
 * which performs the boundary-discipline check at module load. The
 * returned shape is consumed by {@link AgentRuntime} and the agent
 * registry tooling.
 */

import type { ZodTypeAny } from 'zod';
import type { PromptTemplate } from './prompt.js';
import type { AgentKind, AutonomyLevel } from './types.js';

/** Reference to a prompt — either an inline template or a file path. */
export type PromptRef = string | PromptTemplate;

/** Range of permissible autonomy levels for a given agent. */
export interface AutonomyRange {
  readonly default: AutonomyLevel;
  readonly max: AutonomyLevel;
}

/**
 * Static description of an agent. Authored via {@link defineAgent},
 * consumed by the runtime, registry, and editor tooling.
 */
export interface AgentDefinition<TInput = unknown, TOutput = unknown> {
  /** Stable identifier (lowercase letters, digits, `_`, `-`, `.`). */
  readonly key: string;
  readonly kind: AgentKind;
  /**
   * Whether this agent may speak outside the workspace. Only Tom
   * (`key === 'tom'`) may set this to `true`; {@link defineAgent}
   * enforces the invariant at authoring time.
   */
  readonly requiresBoundary: boolean;
  readonly description: string;
  readonly inputs: ZodTypeAny;
  readonly outputs: ZodTypeAny;
  readonly promptRef: PromptRef;
  /** Default model identifier; resolved against the model catalogue. */
  readonly model: string;
  /** Skill keys this agent is permitted to invoke. */
  readonly tools: readonly string[];
  readonly autonomy: AutonomyRange;
  readonly version: number;
  /** Optional eval suite identifier (resolved against `@vita/eval`). */
  readonly evalSuiteId?: string | undefined;
  /** Soft cost budget per invocation, in fractional cents. */
  readonly costBudgetCents?: number | undefined;
  readonly metadata?: Record<string, unknown> | undefined;

  /** Phantom marker preserving the TS input/output types after definition. */
  readonly __types?: { input: TInput; output: TOutput } | undefined;
}

const KEY_REGEX = /^[a-z0-9][a-z0-9_.-]{0,127}$/;

/**
 * Author an agent definition with compile-time-safe input/output types
 * and runtime invariants:
 *
 * - Key must match `^[a-z0-9][a-z0-9_.-]{0,127}$`.
 * - `requiresBoundary: true` is only permitted when `key === 'tom'`
 *   (the Tom-only-boundary discipline; see ADR-0004).
 * - Schemas must be valid Zod types.
 */
export function defineAgent<TInput = unknown, TOutput = unknown>(
  def: AgentDefinition<TInput, TOutput>,
): AgentDefinition<TInput, TOutput> {
  if (!KEY_REGEX.test(def.key)) {
    throw new Error(
      `Agent key '${def.key}' is invalid; must match ${KEY_REGEX.toString()} and be 1-128 chars`,
    );
  }
  if (def.requiresBoundary && def.key !== 'tom') {
    throw new Error(
      `Only Tom may have requiresBoundary=true (got: '${def.key}'). See ADR-0004 (tom-as-only-boundary-agent).`,
    );
  }
  if (!def.inputs || typeof def.inputs.safeParse !== 'function') {
    throw new Error(`Agent '${def.key}' must declare a Zod 'inputs' schema`);
  }
  if (!def.outputs || typeof def.outputs.safeParse !== 'function') {
    throw new Error(`Agent '${def.key}' must declare a Zod 'outputs' schema`);
  }
  if (def.version < 1 || !Number.isInteger(def.version)) {
    throw new Error(`Agent '${def.key}' version must be a positive integer (got ${def.version})`);
  }
  return def;
}

/** Helper used by docs/tooling to recover the input type from a definition. */
export type InferAgentInput<A> = A extends AgentDefinition<infer I, unknown> ? I : never;
/** Helper used by docs/tooling to recover the output type from a definition. */
export type InferAgentOutput<A> = A extends AgentDefinition<unknown, infer O> ? O : never;
