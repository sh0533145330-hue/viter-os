import { describe, expect, it } from 'vitest';
import { BudgetGuard } from '../budgets.js';
import { BudgetExceededError } from '../errors.js';

describe('BudgetGuard', () => {
  it('allows spend under cap', () => {
    const guard = new BudgetGuard({ spentCents: 0, capCents: 1000 });
    const d = guard.preCheck(100);
    expect(d.allow).toBe(true);
    expect(d.hardStop).toBe(false);
    expect(d.remainingCents).toBe(1000);
  });

  it('flags warn when approaching cap', () => {
    const guard = new BudgetGuard({ spentCents: 700, capCents: 1000 });
    const d = guard.preCheck(150);
    expect(d.warn).toBe(true);
    expect(d.allow).toBe(true);
  });

  it('hard stops when projected over cap', () => {
    const guard = new BudgetGuard({ spentCents: 900, capCents: 1000 });
    const d = guard.preCheck(150);
    expect(d.allow).toBe(false);
    expect(d.hardStop).toBe(true);
  });

  it('record() throws once cap exceeded', () => {
    const guard = new BudgetGuard({ spentCents: 990, capCents: 1000 });
    expect(() => guard.record(50)).toThrow(BudgetExceededError);
  });

  it('snapshot reflects recorded spend', () => {
    const guard = new BudgetGuard({ spentCents: 100, capCents: 1000 });
    guard.record(200);
    expect(guard.snapshot()).toEqual({ spentCents: 300, capCents: 1000, remainingCents: 700 });
  });

  it('rejects negative cap and spend', () => {
    expect(() => new BudgetGuard({ spentCents: -1, capCents: 100 })).toThrow();
    expect(() => new BudgetGuard({ spentCents: 0, capCents: -1 })).toThrow();
  });
});
