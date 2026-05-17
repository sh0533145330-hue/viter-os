/**
 * JSONata helpers used by gate and utility blocks.
 *
 * Wraps the upstream `jsonata` library with:
 *  - a parse cache so repeated evaluations of the same expression skip parsing,
 *  - a per-eval timeout (default 250ms) enforced via AbortController + setTimeout,
 *  - a structured error surface so callers receive `{ error: { code, message } }`
 *    rather than thrown exceptions.
 */

import jsonata from 'jsonata';

/** Result of a single JSONata evaluation. */
export type JSONataResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; position?: number | undefined } };

/** Options accepted by {@link evaluateJSONata}. */
export interface EvaluateOptions {
  /** Hard cap per evaluation. Default 250ms. */
  readonly timeoutMs?: number;
  /** Variable bindings passed to JSONata (e.g. `$workspace`, `$now`). */
  readonly bindings?: Record<string, unknown>;
}

interface CacheEntry {
  expression: ReturnType<typeof jsonata>;
  hits: number;
}

const cache = new Map<string, CacheEntry>();
let cacheMisses = 0;

/** Statistics for the parse cache. */
export interface JSONataCacheStats {
  size: number;
  totalHits: number;
  totalMisses: number;
}

/** Read parse-cache stats. Useful for assertions in tests. */
export function getJSONataCacheStats(): JSONataCacheStats {
  let totalHits = 0;
  for (const entry of cache.values()) totalHits += entry.hits;
  return { size: cache.size, totalHits, totalMisses: cacheMisses };
}

/** Reset the parse cache. Test-only. */
export function resetJSONataCache(): void {
  cache.clear();
  cacheMisses = 0;
}

/**
 * Compile (or fetch from cache) a JSONata expression. Returns `undefined`
 * when the expression cannot be parsed; consumers must handle that.
 */
export function compileJSONata(expression: string): ReturnType<typeof jsonata> | undefined {
  const cached = cache.get(expression);
  if (cached) {
    cached.hits += 1;
    return cached.expression;
  }
  cacheMisses += 1;
  try {
    const compiled = jsonata(expression);
    cache.set(expression, { expression: compiled, hits: 0 });
    return compiled;
  } catch {
    return undefined;
  }
}

const DEFAULT_TIMEOUT_MS = 250;

/**
 * Evaluate a JSONata expression against `context`. Always resolves with a
 * structured {@link JSONataResult} — never throws.
 */
export async function evaluateJSONata<T = unknown>(
  expression: string,
  context: unknown,
  options: EvaluateOptions = {},
): Promise<JSONataResult<T>> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const compiled = compileJSONata(expression);
  if (!compiled) {
    return { ok: false, error: { code: 'PARSE_ERROR', message: 'Failed to parse expression' } };
  }

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<JSONataResult<T>>((resolve) => {
    timer = setTimeout(() => {
      resolve({
        ok: false,
        error: { code: 'TIMEOUT', message: `JSONata evaluation exceeded ${timeoutMs}ms` },
      });
    }, timeoutMs);
    timer.unref?.();
  });

  const evalPromise: Promise<JSONataResult<T>> = (async () => {
    try {
      const value = (await compiled.evaluate(context, options.bindings ?? {})) as T;
      return { ok: true, value };
    } catch (err) {
      const e = err as { code?: string; message?: string; position?: number };
      return {
        ok: false,
        error: {
          code: e.code ?? 'EVAL_ERROR',
          message: e.message ?? String(err),
          position: e.position,
        },
      };
    }
  })();

  try {
    return await Promise.race([evalPromise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
