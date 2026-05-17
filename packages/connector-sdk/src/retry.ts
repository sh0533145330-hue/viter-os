/**
 * Retry with exponential backoff and full jitter.
 *
 * Used by connector sync loops, webhook dispatchers, and the
 * dead-letter retry worker to recover from transient upstream
 * failures without thundering-herd risk.
 */

export interface RetryOptions {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs?: number | undefined;
  readonly jitter?: boolean | undefined;
  readonly isRetryable?: ((error: unknown, attempt: number) => boolean) | undefined;
  readonly onRetry?: ((error: unknown, attempt: number, delayMs: number) => void) | undefined;
  /** Override for `setTimeout`; useful in tests. */
  readonly sleep?: ((ms: number) => Promise<void>) | undefined;
  /** Override for `Math.random`; useful in tests. */
  readonly random?: (() => number) | undefined;
}

/**
 * Run `fn` up to `maxAttempts` times. Each retry delay is
 *
 *   d = min(maxDelayMs, baseDelayMs * 2^(attempt-1))
 *   if jitter: d = d * random()           // full-jitter
 *
 * `isRetryable` defaults to `() => true`. The final error is
 * rethrown after the last failed attempt.
 */
export async function retry<T>(fn: (attempt: number) => Promise<T>, opts: RetryOptions): Promise<T> {
  if (opts.maxAttempts < 1) {
    throw new Error('retry: maxAttempts must be >= 1');
  }
  const sleep = opts.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const random = opts.random ?? Math.random;
  const isRetryable = opts.isRetryable ?? (() => true);
  const maxDelay = opts.maxDelayMs ?? 30_000;
  const useJitter = opts.jitter ?? true;

  let lastError: unknown;
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt >= opts.maxAttempts || !isRetryable(err, attempt)) {
        throw err;
      }
      const exp = Math.min(maxDelay, opts.baseDelayMs * 2 ** (attempt - 1));
      const delay = Math.max(0, Math.floor(useJitter ? random() * exp : exp));
      opts.onRetry?.(err, attempt, delay);
      await sleep(delay);
    }
  }
  // Unreachable; satisfies the type checker.
  throw lastError;
}
