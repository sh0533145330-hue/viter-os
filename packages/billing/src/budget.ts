import { BudgetExceededError, type BudgetState, type Logger } from './types.js';

export interface BudgetCheckResult {
  allowed: boolean;
  warning: boolean;
  hardStop: boolean;
  spentPct: number;
  remainingCents: number;
}

export class BudgetGuard {
  constructor(private state: BudgetState, private logger?: Logger) {}

  preCheck(estimateCents: number): BudgetCheckResult {
    const projected = this.state.spentCents + estimateCents;
    const pct = this.state.capCents > 0 ? projected / this.state.capCents : 0;
    const result: BudgetCheckResult = {
      allowed: pct < this.state.hardStopThresholdPct,
      warning: pct >= this.state.warningThresholdPct && pct < this.state.hardStopThresholdPct,
      hardStop: pct >= this.state.hardStopThresholdPct,
      spentPct: pct,
      remainingCents: Math.max(0, this.state.capCents - projected),
    };
    if (result.hardStop) {
      this.logger?.warn('budget hard stop reached', { workspaceId: this.state.workspaceId, pct });
    } else if (result.warning) {
      this.logger?.warn('budget warning threshold reached', { workspaceId: this.state.workspaceId, pct });
    }
    return result;
  }

  enforce(estimateCents: number): void {
    const check = this.preCheck(estimateCents);
    if (!check.allowed) throw new BudgetExceededError(this.state);
  }

  record(actualCents: number): void {
    this.state.spentCents += actualCents;
  }

  snapshot(): BudgetState {
    return { ...this.state };
  }
}

export function defaultBudgetState(workspaceId: string, period: string, capCents: number): BudgetState {
  return {
    workspaceId,
    period,
    capCents,
    spentCents: 0,
    warningThresholdPct: 0.75,
    hardStopThresholdPct: 1.0,
  };
}
