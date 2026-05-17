import { describe, it, expect } from 'vitest';
import { McpRateLimiter } from '../rate-limit.js';

describe('McpRateLimiter', () => {
  it('allows requests under the rpm limit', () => {
    const rl = new McpRateLimiter({ rpm: 5, dailyCostCapCents: 1000 });
    for (let i = 0; i < 5; i++) {
      expect(rl.check('u1').allowed).toBe(true);
    }
  });

  it('blocks once rpm exceeded', () => {
    const rl = new McpRateLimiter({ rpm: 3, dailyCostCapCents: 1000 });
    rl.check('u1'); rl.check('u1'); rl.check('u1');
    const result = rl.check('u1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit');
  });

  it('isolates buckets per user', () => {
    const rl = new McpRateLimiter({ rpm: 1, dailyCostCapCents: 1000 });
    expect(rl.check('u1').allowed).toBe(true);
    expect(rl.check('u2').allowed).toBe(true);
  });

  it('blocks once daily cost cap reached', () => {
    const rl = new McpRateLimiter({ rpm: 100, dailyCostCapCents: 500 });
    rl.recordCost('u1', 500);
    expect(rl.check('u1').allowed).toBe(false);
  });

  it('records and returns stats', () => {
    const rl = new McpRateLimiter({ rpm: 10, dailyCostCapCents: 1000 });
    rl.check('u1');
    rl.recordCost('u1', 50);
    const stats = rl.getStats('u1');
    expect(stats.rpm).toBe(1);
    expect(stats.dailyCostCents).toBe(50);
  });
});
