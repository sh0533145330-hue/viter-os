import { describe, expect, it } from 'vitest';
import { StaticAutonomyResolver, compareAutonomy } from '../autonomy.js';

describe('autonomy', () => {
  it('orders levels correctly', () => {
    expect(compareAutonomy('suggest', 'draft_confirm')).toBeLessThan(0);
    expect(compareAutonomy('auto_with_veto', 'suggest')).toBeGreaterThan(0);
    expect(compareAutonomy('draft_confirm', 'draft_confirm')).toBe(0);
  });

  it('falls back through layered defaults', async () => {
    const r = new StaticAutonomyResolver('draft_confirm');
    expect(await r.resolveForUser('ws', 'u1', 'tom', 'email.send')).toBe('draft_confirm');
    r.set('ws', 'u1', '*', '*', 'auto_with_limits');
    expect(await r.resolveForUser('ws', 'u1', 'tom', 'email.send')).toBe('auto_with_limits');
    r.set('ws', 'u1', 'tom', '*', 'auto_with_veto');
    expect(await r.resolveForUser('ws', 'u1', 'tom', 'email.send')).toBe('auto_with_veto');
    r.set('ws', 'u1', 'tom', 'email.send', 'suggest');
    expect(await r.resolveForUser('ws', 'u1', 'tom', 'email.send')).toBe('suggest');
  });
});
