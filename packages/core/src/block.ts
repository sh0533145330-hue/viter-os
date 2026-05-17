/**
 * Block authoring primitive for the VitaOS engine.
 *
 * A *block* is a typed, idempotent (when declared so) unit of work. Workflows
 * compose blocks via wires; the runtime ({@link ./runtime}) dispatches each
 * block, enforcing schema validation, timeouts, and retries.
 *
 * Authors declare blocks with {@link defineBlock} and consumers receive a
 * compile-time-safe {@link BlockDefinition}.
 */

import type { ZodTypeAny, z } from 'zod';
import type { BlockId, EventBus, RunId, StepId } from './events.js';

/** Block category. Used by the editor palette and engine routing rules. */
export type BlockCategory = 'entity' | 'action' | 'agent' | 'gate' | 'source' | 'utility';

/** Minimal structured logger plumbed into every block handler. */
export interface BlockLogger {
  info(message: string, data?: object): void;
  warn(message: string, data?: object): void;
  error(message: string, data?: object): void;
  debug?(message: string, data?: object): void;
}

/**
 * Runtime context handed to every block handler. Custom context fields can
 * be layered by parameterising {@link BlockHandler} with a `TCtx` shape.
 */
export interface BlockContext {
  readonly workspaceId: string;
  readonly runId: RunId;
  readonly stepId: StepId;
  readonly blockId: BlockId;
  readonly logger: BlockLogger;
  readonly abort: AbortSignal;
  readonly events: EventBus;
  emit(eventKind: string, payload: Record<string, unknown>): void;
}

/** A block handler receives validated input and returns output of the declared type. */
export type BlockHandler<TIn, TOut, TCtx extends object = object> = (
  input: TIn,
  ctx: BlockContext & TCtx,
) => Promise<TOut>;

/** Retry policy applied by the runtime when a handler throws a retryable error. */
export interface RetryPolicy {
  readonly max: number;
  readonly backoffMs: number;
  readonly jitter?: number;
}

/**
 * Static description of a block. The factory {@link defineBlock} returns
 * this shape so the runtime, editor, and registry tooling can introspect
 * inputs/outputs without executing user code.
 */
export interface BlockDefinition<TIn = unknown, TOut = unknown, TCtx extends object = object> {
  readonly key: string;
  readonly category: BlockCategory;
  readonly inputs: ZodTypeAny;
  readonly outputs: ZodTypeAny;
  readonly idempotent: boolean;
  readonly timeoutMs?: number;
  readonly retries?: RetryPolicy;
  readonly handler: BlockHandler<TIn, TOut, TCtx>;
  readonly description?: string;
  readonly metadata?: Record<string, unknown>;
  readonly compensate?: BlockHandler<TIn, void, TCtx>;
}

/** Helper used by docs and the editor to introspect a block's TS input type. */
export type InferBlockInput<B> = B extends BlockDefinition<infer I, unknown, object> ? I : never;
export type InferBlockOutput<B> = B extends BlockDefinition<unknown, infer O, object> ? O : never;

const KEY_REGEX = /^[a-z0-9][a-z0-9_.-]{0,127}$/i;

/**
 * Declare a block. The returned definition is the canonical shape consumed
 * by the runtime and the workflow runner. Errors thrown here are authoring
 * errors and surface at module-load time.
 */
export function defineBlock<TIn, TOut, TCtx extends object = object>(
  def: BlockDefinition<TIn, TOut, TCtx>,
): BlockDefinition<TIn, TOut, TCtx> {
  if (!KEY_REGEX.test(def.key)) {
    throw new Error(
      `Block key '${def.key}' is invalid; must match ${KEY_REGEX.toString()} and be 1-128 chars`,
    );
  }
  if (!def.inputs || typeof def.inputs.safeParse !== 'function') {
    throw new Error(`Block '${def.key}' must declare a Zod 'inputs' schema`);
  }
  if (!def.outputs || typeof def.outputs.safeParse !== 'function') {
    throw new Error(`Block '${def.key}' must declare a Zod 'outputs' schema`);
  }
  if (typeof def.handler !== 'function') {
    throw new Error(`Block '${def.key}' must declare a 'handler' function`);
  }
  if (def.timeoutMs !== undefined && def.timeoutMs <= 0) {
    throw new Error(`Block '${def.key}' timeoutMs must be > 0`);
  }
  if (def.retries) {
    if (def.retries.max < 0) throw new Error(`Block '${def.key}' retries.max must be >= 0`);
    if (def.retries.backoffMs < 0) {
      throw new Error(`Block '${def.key}' retries.backoffMs must be >= 0`);
    }
  }
  return def;
}

/** Convenience: build the inferred input type from a Zod schema. */
export type ZIn<S extends ZodTypeAny> = z.infer<S>;
