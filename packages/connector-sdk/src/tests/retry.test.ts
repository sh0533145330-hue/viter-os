import { describe, expect, it, vi } from 'vitest';
import { retry } from '../retry.js';

describe('retry', () => {
  it('returns the first successful result', async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const result = await retry(fn, { maxAttempts: 3, baseDelayMs: 1, jitter: false });
    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until success', async () => {
    let calls = 0;
    const fn = async (): Promise<string> => {
      calls += 1;
      if (calls < 3) throw new Error('boom');
      return 'ok';
    };
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await retry(fn, {
      maxAttempts: 5,
      baseDelayMs: 10,
      jitter: false,
      sleep,
    });
    expect(result).toBe('ok');
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('rethrows after maxAttempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('nope'));
    await expect(
      retry(fn, { maxAttempts: 2, baseDelayMs: 1, jitter: false, sleep: async () => {} }),
    ).rejects.toThrow(/nope/);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('honours isRetryable=false', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('fatal'), { fatal: true }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(
      retry(fn, {
        maxAttempts: 5,
        baseDelayMs: 1,
        jitter: false,
        sleep,
        isRetryable: (err) => !(err as { fatal?: boolean }).fatal,
      }),
    ).rejects.toThrow(/fatal/);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('applies exponential backoff without jitter', async () => {
    const delays: number[] = [];
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(
      retry(fn, {
        maxAttempts: 4,
        baseDelayMs: 10,
        jitter: false,
        maxDelayMs: 1_000,
        sleep: async (ms) => {
          delays.push(ms);
        },
      }),
    ).rejects.toThrow();
    expect(delays).toEqual([10, 20, 40]);
  });

  it('uses full-jitter when enabled', async () => {
    const delays: number[] = [];
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(
      retry(fn, {
        maxAttempts: 3,
        baseDelayMs: 100,
        jitter: true,
        maxDelayMs: 1_000,
        random: () => 0.5,
        sleep: async (ms) => {
          delays.push(ms);
        },
      }),
    ).rejects.toThrow();
    expect(delays).toEqual([50, 100]);
  });

  it('rejects bogus maxAttempts', async () => {
    await expect(retry(async () => 1, { maxAttempts: 0, baseDelayMs: 1 })).rejects.toThrow(
      /maxAttempts/,
    );
  });
});
