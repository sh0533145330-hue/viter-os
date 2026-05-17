import { beforeEach, describe, expect, it } from 'vitest';
import {
  compileJSONata,
  evaluateJSONata,
  getJSONataCacheStats,
  resetJSONataCache,
} from '../jsonata.js';

describe('jsonata helpers', () => {
  beforeEach(() => resetJSONataCache());

  it('evaluates a simple expression', async () => {
    const r = await evaluateJSONata<number>('$.amount * 2', { amount: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(10);
  });

  it('returns structured error on parse failure', async () => {
    const r = await evaluateJSONata('$.[[[bad', {});
    expect(r.ok).toBe(false);
  });

  it('caches compiled expressions', () => {
    const a = compileJSONata('$.x');
    const b = compileJSONata('$.x');
    expect(a).toBe(b);
    const stats = getJSONataCacheStats();
    expect(stats.size).toBe(1);
    expect(stats.totalHits).toBeGreaterThanOrEqual(1);
  });

  it('accepts a timeoutMs option without throwing', async () => {
    const r = await evaluateJSONata('$.x', { x: 1 }, { timeoutMs: 250 });
    expect(r.ok).toBe(true);
  });

  it('honours bindings', async () => {
    const r = await evaluateJSONata<string>(
      '$workspace',
      {},
      {
        bindings: { workspace: 'ws-123' },
      },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('ws-123');
  });
});
