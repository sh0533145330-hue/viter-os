/**
 * Per-workspace budget enforcement.
 *
 * The engine consults {@link BudgetGuard} before invoking any block that
 * incurs cost. Two thresholds are honoured: a soft warning level (default
 * 80% of cap) and a hard stop at the cap.
 */

import { BudgetExceededError } from './errors.js';

/** Snapshot of a workspace's spend. */
export interface BudgetState {
  spentCents: number;
  capCents: number;
  /** Optional soft-warning ratio (0..1). Defaults to 0.8. */
  warnRatio?: number;
}

/** Outcome of {@link BudgetGuard.preCheck}. */
export interface BudgetDecision {
  allow: boolean;
  warn: boolean;
  hardStop: boolean;
  remainingCents: number;
  projectedCents: number;
}

/** Mutable per-workspace budget guard. Thread-safe within a single process. */
export class BudgetGuard {
  private spent: number;
  private readonly cap: number;
  private readonly warnRatio: number;

  constructor(state: BudgetState) {
    if (state.capCents < 0) throw new Error('capCents must be >= 0');
    if (state.spentCents < 0) throw new Error('spentCents must be >= 0');
    this.spent = state.spentCents;
    this.cap = state.capCents;
    this.warnRatio = state.warnRatio ?? 0.8;
  }

  /** Project the impact of a candidate spend without recording it. */
  preCheck(estimateCents: number): BudgetDecision {
    const projected = this.spent + Math.max(0, estimateCents);
    const remaining = Math.max(0, this.cap - this.spent);
    const hardStop = projected > this.cap;
    const warn = !hardStop && projected >= this.cap * this.warnRatio;
    return {
      allow: !hardStop,
      warn,
      hardStop,
      remainingCents: remaining,
      projectedCents: projected,
    };
  }

  /** Record actual spend. Throws if the recorded value would cross the cap. */
  record(cents: number): void {
    if (cents < 0) throw new Error('cannot record negative spend');
    const projected = this.spent + cents;
    if (projected > this.cap) {
      throw new BudgetExceededError(
        `Workspace budget exhausted: ${projected}¢ > cap ${this.cap}¢`,
        { spentCents: this.spent, capCents: this.cap, attemptedCents: cents },
      );
    }
    this.spent = projected;
  }

  /** Read the live snapshot. */
  snapshot(): { spentCents: number; capCents: number; remainingCents: number } {
    return {
      spentCents: this.spent,
      capCents: this.cap,
      remainingCents: Math.max(0, this.cap - this.spent),
    };
  }
}
