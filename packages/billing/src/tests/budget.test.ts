import { describe, it, expect } from 'vitest';
import { BudgetGuard, defaultBudgetState } from '../budget.js';
import { BudgetExceededError } from '../types.js';

describe('BudgetGuard', () => {
  it('allows spend under warning threshold', () => {
    const guard = new BudgetGuard(defaultBudgetState('ws-1', '2026-05', 10000));
    const result = guard.preCheck(5000);
    expect(result.allowed).toBe(true);
    expect(result.warning).toBe(false);
    expect(result.hardStop).toBe(false);
  });

  it('flags warning past 75%', () => {
    const guard = new BudgetGuard(defaultBudgetState('ws-1', '2026-05', 10000));
    const result = guard.preCheck(8000);
    expect(result.warning).toBe(true);
    expect(result.allowed).toBe(true);
  });

  it('hard stops at 100%', () => {
    const guard = new BudgetGuard(defaultBudgetState('ws-1', '2026-05', 10000));
    const result = guard.preCheck(10000);
    expect(result.hardStop).toBe(true);
    expect(result.allowed).toBe(false);
  });

  it('enforce throws BudgetExceededError', () => {
    const guard = new BudgetGuard(defaultBudgetState('ws-1', '2026-05', 1000));
    expect(() => guard.enforce(2000)).toThrow(BudgetExceededError);
  });

  it('record updates state', () => {
    const guard = new BudgetGuard(defaultBudgetState('ws-1', '2026-05', 10000));
    guard.record(1500);
    expect(guard.snapshot().spentCents).toBe(1500);
  });

  it('snapshot is a copy', () => {
    const guard = new BudgetGuard(defaultBudgetState('ws-1', '2026-05', 10000));
    const snap1 = guard.snapshot();
    guard.record(500);
    expect(snap1.spentCents).toBe(0);
    expect(guard.snapshot().spentCents).toBe(500);
  });
});
