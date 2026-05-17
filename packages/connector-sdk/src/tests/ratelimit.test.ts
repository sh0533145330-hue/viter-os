import { describe, expect, it } from 'vitest';
import {
  RateLimiterRegistry,
  TokenBucket,
  getRateLimiter,
  resetRateLimiters,
} from '../ratelimit.js';

describe('TokenBucket', () => {
  it('consumes tokens up to capacity', () => {
    const bucket = new TokenBucket({ capacity: 3, refillPerSecond: 1, now: () => 0 });
    expect(bucket.tryConsume()).toBe(true);
    expect(bucket.tryConsume()).toBe(true);
    expect(bucket.tryConsume()).toBe(true);
    expect(bucket.tryConsume()).toBe(false);
  });

  it('refills over time', () => {
    let now = 0;
    const bucket = new TokenBucket({ capacity: 5, refillPerSecond: 10, now: () => now });
    bucket.tryConsume(5);
    expect(bucket.tryConsume()).toBe(false);
    now = 500;
    expect(bucket.tryConsume(5)).toBe(true);
  });

  it('rejects bogus configuration', () => {
    expect(() => new TokenBucket({ capacity: 0, refillPerSecond: 1 })).toThrow();
    expect(() => new TokenBucket({ capacity: 1, refillPerSecond: 0 })).toThrow();
  });

  it('waitForToken resolves once enough capacity is available', async () => {
    const bucket = new TokenBucket({ capacity: 1, refillPerSecond: 1000 });
    bucket.tryConsume();
    await bucket.waitForToken();
    expect(bucket.available).toBeLessThanOrEqual(1);
  });

  it('waitForToken rejects requests larger than capacity', async () => {
    const bucket = new TokenBucket({ capacity: 1, refillPerSecond: 1 });
    await expect(bucket.waitForToken(2)).rejects.toThrow(/capacity/);
  });
});

describe('RateLimiterRegistry', () => {
  it('returns the same bucket for the same key', () => {
    const reg = new RateLimiterRegistry({ capacity: 1, refillPerSecond: 1 });
    const a = reg.get('slack', 'inst-1');
    const b = reg.get('slack', 'inst-1');
    expect(a).toBe(b);
    expect(reg.size()).toBe(1);
  });

  it('keeps separate buckets per upstream', () => {
    const reg = new RateLimiterRegistry({ capacity: 1, refillPerSecond: 1 });
    reg.get('slack', 'inst-1');
    reg.get('gmail', 'inst-1');
    expect(reg.size()).toBe(2);
  });
});

describe('getRateLimiter', () => {
  it('shares a process-wide registry', () => {
    resetRateLimiters();
    const a = getRateLimiter('slack', 'inst-1');
    const b = getRateLimiter('slack', 'inst-1');
    expect(a).toBe(b);
    resetRateLimiters();
  });
});
