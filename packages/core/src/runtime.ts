/**
 * Block runtime.
 *
 * Single block dispatcher. Honours:
 *  - input + output schema validation (Zod),
 *  - per-block timeoutMs via AbortController,
 *  - retry policy with exponential backoff + jitter,
 *  - idempotency cache via an injected {@link IdempotencyStore},
 *  - cancellation via the parent AbortSignal,
 *  - event emission (`block.started`, `block.succeeded`, `block.failed`, `block.retried`).
 *
 * The runtime is intentionally library-style: callers wire in their own
 * persistence, logger, and idempotency store. It performs no I/O of its
 * own beyond the user-supplied handler.
 */

import type { BlockContext, BlockDefinition, BlockLogger } from './block.js';
import {
  BlockCancelledError,
  BlockNonRetryableError,
  BlockTimeoutError,
  BlockValidationError,
  VitaError,
} from './errors.js';
import type { BlockId, EventBus, RunId, StepId } from './events.js';

/**
 * Persistence-free cache used by the runtime to short-circuit idempotent
 * re-dispatches. Implementations may be in-memory (tests), Redis, or
 * Postgres advisory locks.
 */
export interface IdempotencyStore {
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown, ttlMs?: number): Promise<void>;
}

/** No-op idempotency store. Useful when caller has no caching needs. */
export class NullIdempotencyStore implements IdempotencyStore {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(_key: string): Promise<unknown | undefined> {
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async set(_key: string, _value: unknown, _ttlMs?: number): Promise<void> {
    return;
  }
}

/** In-memory cache for development/tests. */
export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly map = new Map<string, { value: unknown; expiresAt: number }>();
  async get(key: string): Promise<unknown | undefined> {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt !== 0 && hit.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value;
  }
  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    this.map.set(key, {
      value,
      expiresAt: ttlMs && ttlMs > 0 ? Date.now() + ttlMs : 0,
    });
  }
  clear(): void {
    this.map.clear();
  }
}

const consoleLogger: BlockLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
};

/** Options that adjust how a single block invocation is dispatched. */
export interface RunBlockOptions {
  readonly runId: RunId;
  readonly stepId: StepId;
  readonly blockId: BlockId;
  readonly workspaceId: string;
  readonly events: EventBus;
  readonly logger?: BlockLogger;
  /** Externally supplied AbortSignal so callers can cancel the dispatch. */
  readonly signal?: AbortSignal;
  /** Idempotency cache. Defaults to {@link NullIdempotencyStore}. */
  readonly idempotency?: IdempotencyStore;
  /** Optional stable key for idempotency lookups. */
  readonly idempotencyKey?: string;
  /** Time-to-live for cached idempotency results. Default 24h. */
  readonly idempotencyTtlMs?: number;
  /** Additional fields appended to the BlockContext (e.g. `db`, `agentRuntime`). */
  readonly extraContext?: object;
  /**
   * Override of the wall clock timer. Tests pass a deterministic sleeper to
   * avoid real backoff delays.
   */
  readonly sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new BlockCancelledError('Cancelled before sleep'));
      return;
    }
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      cleanup();
      reject(new BlockCancelledError('Cancelled during sleep'));
    };
    function cleanup() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function jitterMs(backoffMs: number, jitter: number): number {
  const variance = backoffMs * jitter;
  return backoffMs + (Math.random() * 2 - 1) * variance;
}

function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Dispatch a single block. Returns the validated output on success and
 * throws a {@link VitaError} subtype on failure.
 */
export async function runBlock<TIn, TOut, TCtx extends object>(
  block: BlockDefinition<TIn, TOut, TCtx>,
  rawInput: unknown,
  options: RunBlockOptions,
): Promise<TOut> {
  const {
    runId,
    stepId,
    blockId,
    workspaceId,
    events,
    logger = consoleLogger,
    signal,
    idempotency,
    idempotencyKey,
    idempotencyTtlMs = DEFAULT_IDEMPOTENCY_TTL_MS,
    extraContext = {},
    sleep = defaultSleep,
  } = options;

  const inputParse = block.inputs.safeParse(rawInput);
  if (!inputParse.success) {
    const err = new BlockValidationError(
      `Block '${block.key}' rejected input: ${inputParse.error.message}`,
      { issues: inputParse.error.issues },
    );
    events.emit({
      type: 'block.failed',
      runId,
      blockId,
      stepId,
      blockKey: block.key,
      error: { code: err.code, message: err.message },
      at: isoNow(),
    });
    throw err;
  }
  const input = inputParse.data as TIn;

  if (block.idempotent && idempotency && idempotencyKey) {
    const cached = await idempotency.get(idempotencyKey);
    if (cached !== undefined) {
      const cachedParse = block.outputs.safeParse(cached);
      if (cachedParse.success) {
        events.emit({
          type: 'block.succeeded',
          runId,
          blockId,
          stepId,
          blockKey: block.key,
          output: cachedParse.data,
          latencyMs: 0,
          at: isoNow(),
        });
        return cachedParse.data as TOut;
      }
    }
  }

  const retries = block.retries ?? { max: 0, backoffMs: 0, jitter: 0 };
  const timeoutMs = block.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();

  events.emit({
    type: 'block.started',
    runId,
    blockId,
    stepId,
    blockKey: block.key,
    at: isoNow(),
  });

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries.max; attempt++) {
    if (signal?.aborted) {
      const err = new BlockCancelledError('Block cancelled by caller');
      events.emit({
        type: 'block.failed',
        runId,
        blockId,
        stepId,
        blockKey: block.key,
        error: { code: err.code, message: err.message },
        at: isoNow(),
      });
      throw err;
    }

    const controller = new AbortController();
    const onParentAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', onParentAbort, { once: true });
    const timeoutHandle = setTimeout(
      () => controller.abort(new BlockTimeoutError('timeout')),
      timeoutMs,
    );
    timeoutHandle.unref?.();

    const ctx: BlockContext = {
      workspaceId,
      runId,
      stepId,
      blockId,
      logger,
      abort: controller.signal,
      events,
      emit: (kind, payload) => {
        logger.debug?.(`emit:${kind}`, payload);
      },
    };

    try {
      const result = await Promise.race<TOut>([
        block.handler(input, { ...(extraContext as TCtx), ...ctx } as BlockContext & TCtx),
        new Promise<TOut>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            const reason = controller.signal.reason;
            if (reason instanceof BlockTimeoutError) reject(reason);
            else reject(new BlockCancelledError('Cancelled mid-flight'));
          });
        }),
      ]);

      const outputParse = block.outputs.safeParse(result);
      if (!outputParse.success) {
        throw new BlockValidationError(
          `Block '${block.key}' produced invalid output: ${outputParse.error.message}`,
          { issues: outputParse.error.issues },
        );
      }

      if (block.idempotent && idempotency && idempotencyKey) {
        await idempotency.set(idempotencyKey, outputParse.data, idempotencyTtlMs);
      }

      events.emit({
        type: 'block.succeeded',
        runId,
        blockId,
        stepId,
        blockKey: block.key,
        output: outputParse.data,
        latencyMs: Date.now() - startedAt,
        at: isoNow(),
      });
      return outputParse.data as TOut;
    } catch (err) {
      lastError = err;
      if (err instanceof BlockNonRetryableError || err instanceof BlockValidationError) {
        events.emit({
          type: 'block.failed',
          runId,
          blockId,
          stepId,
          blockKey: block.key,
          error: errorPayload(err),
          at: isoNow(),
        });
        throw err;
      }
      if (err instanceof BlockCancelledError) {
        events.emit({
          type: 'block.failed',
          runId,
          blockId,
          stepId,
          blockKey: block.key,
          error: errorPayload(err),
          at: isoNow(),
        });
        throw err;
      }

      if (attempt < retries.max) {
        const backoff = jitterMs(retries.backoffMs * 2 ** attempt, retries.jitter ?? 0);
        events.emit({
          type: 'block.retried',
          runId,
          blockId,
          stepId,
          blockKey: block.key,
          attempt: attempt + 1,
          backoffMs: backoff,
          at: isoNow(),
        });
        await sleep(Math.max(0, Math.round(backoff)), signal);
        continue;
      }

      const failure = err instanceof Error ? err : new Error(String(err));
      events.emit({
        type: 'block.failed',
        runId,
        blockId,
        stepId,
        blockKey: block.key,
        error: errorPayload(failure),
        at: isoNow(),
      });
      throw failure;
    } finally {
      clearTimeout(timeoutHandle);
      signal?.removeEventListener('abort', onParentAbort);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function errorPayload(err: unknown): { code: string; message: string } {
  if (err instanceof VitaError) return { code: err.code, message: err.message };
  if (err instanceof Error) return { code: 'UNKNOWN', message: err.message };
  return { code: 'UNKNOWN', message: String(err) };
}
