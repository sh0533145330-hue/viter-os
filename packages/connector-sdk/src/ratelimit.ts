/**
 * Per-upstream token bucket + a tiny registry that scopes limiters
 * by `(provider, instance)`. Used by connector sync loops to throttle
 * outbound calls before they hit upstream rate caps.
 */

import type { RateLimiter } from './types.js';

export interface TokenBucketOptions {
  readonly capacity: number;
  readonly refillPerSecond: number;
  readonly now?: () => number;
}

export class TokenBucket implements RateLimiter {
  readonly capacity: number;
  private tokens: number;
  private readonly refillPerSecond: number;
  private lastRefill: number;
  private readonly nowFn: () => number;

  constructor(opts: TokenBucketOptions) {
    if (opts.capacity <= 0) throw new Error('TokenBucket capacity must be > 0');
    if (opts.refillPerSecond <= 0) throw new Error('TokenBucket refillPerSecond must be > 0');
    this.capacity = opts.capacity;
    this.tokens = opts.capacity;
    this.refillPerSecond = opts.refillPerSecond;
    this.nowFn = opts.now ?? (() => Date.now());
    this.lastRefill = this.nowFn();
  }

  get available(): number {
    this.refill();
    return this.tokens;
  }

  tryConsume(n = 1): boolean {
    this.refill();
    if (this.tokens >= n) {
      this.tokens -= n;
      return true;
    }
    return false;
  }

  async waitForToken(n = 1): Promise<void> {
    if (n > this.capacity) {
      throw new Error(`Cannot wait for ${n} tokens; bucket capacity is ${this.capacity}`);
    }
    while (!this.tryConsume(n)) {
      const deficit = n - this.tokens;
      const waitMs = Math.max(1, Math.ceil((deficit / this.refillPerSecond) * 1000));
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  private refill(): void {
    const now = this.nowFn();
    const elapsed = (now - this.lastRefill) / 1000;
    if (elapsed <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSecond);
    this.lastRefill = now;
  }
}

/**
 * Process-wide registry mapping `(provider, instanceId)` → limiter.
 * Limiters are lazily created from `defaultOptions` when missing.
 */
export class RateLimiterRegistry {
  private readonly limiters = new Map<string, TokenBucket>();
  private readonly defaultOptions: TokenBucketOptions;

  constructor(defaultOptions: TokenBucketOptions) {
    this.defaultOptions = defaultOptions;
  }

  get(provider: string, instanceId: string, override?: TokenBucketOptions): TokenBucket {
    const key = `${provider}:${instanceId}`;
    let bucket = this.limiters.get(key);
    if (!bucket) {
      bucket = new TokenBucket(override ?? this.defaultOptions);
      this.limiters.set(key, bucket);
    }
    return bucket;
  }

  size(): number {
    return this.limiters.size;
  }
}

let defaultRegistry: RateLimiterRegistry | undefined;

/** Shared registry used by callers without their own. */
export function getRateLimiter(
  provider: string,
  instanceId: string,
  override?: TokenBucketOptions,
): TokenBucket {
  if (!defaultRegistry) {
    defaultRegistry = new RateLimiterRegistry({ capacity: 60, refillPerSecond: 1 });
  }
  return defaultRegistry.get(provider, instanceId, override);
}

/** Reset the process-wide registry (exposed for tests). */
export function resetRateLimiters(): void {
  defaultRegistry = undefined;
}
