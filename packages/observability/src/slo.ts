import type { SLO, SLOStatus, SLOStatusKind } from './types.js';

export type { SLO, SLOStatus, SLOStatusKind } from './types.js';

export class SLOTracker {
  private readonly slos = new Map<string, SLO>();

  register(slo: SLO): void {
    if (slo.target <= 0 || slo.target >= 1) {
      throw new Error(`SLO target must be in (0, 1), got ${slo.target} for ${slo.key}`);
    }
    if (slo.windowDays <= 0) {
      throw new Error(`SLO windowDays must be positive, got ${slo.windowDays} for ${slo.key}`);
    }
    this.slos.set(slo.key, slo);
  }

  get(key: string): SLO | undefined {
    return this.slos.get(key);
  }

  listAll(): SLO[] {
    return [...this.slos.values()];
  }

  evaluate(slo: SLO, goodCount: number, totalCount: number): SLOStatus {
    if (totalCount < 0 || goodCount < 0 || goodCount > totalCount) {
      throw new Error(
        `SLO ${slo.key}: invalid counts (good=${goodCount}, total=${totalCount})`,
      );
    }

    if (totalCount === 0) {
      return {
        key: slo.key,
        currentPct: 1,
        errorBudgetRemaining: 1,
        errorBudgetSpentPct: 0,
        status: 'healthy',
      };
    }

    const currentPct = goodCount / totalCount;
    const errorRate = 1 - currentPct;
    const allowedErrorRate = 1 - slo.target;
    const errorBudgetSpentPct =
      allowedErrorRate > 0 ? errorRate / allowedErrorRate : errorRate > 0 ? Infinity : 0;
    const errorBudgetRemaining = Math.max(0, 1 - errorBudgetSpentPct);

    const status = this.classify(errorBudgetSpentPct);

    return {
      key: slo.key,
      currentPct,
      errorBudgetRemaining,
      errorBudgetSpentPct,
      status,
    };
  }

  evaluateByKey(key: string, goodCount: number, totalCount: number): SLOStatus | undefined {
    const slo = this.slos.get(key);
    if (!slo) return undefined;
    return this.evaluate(slo, goodCount, totalCount);
  }

  burnRate(slo: SLO, goodCount: number, totalCount: number, windowFractionOfTotal = 1): number {
    if (totalCount === 0) return 0;
    const errorRate = 1 - goodCount / totalCount;
    const allowedErrorRate = 1 - slo.target;
    if (allowedErrorRate <= 0) return errorRate > 0 ? Infinity : 0;
    const windowedAllowance = allowedErrorRate * windowFractionOfTotal;
    if (windowedAllowance <= 0) return errorRate > 0 ? Infinity : 0;
    return errorRate / allowedErrorRate;
  }

  private classify(errorBudgetSpentPct: number): SLOStatusKind {
    if (errorBudgetSpentPct >= 1) return 'breach';
    if (errorBudgetSpentPct >= 0.8) return 'warning';
    return 'healthy';
  }
}

export const DEFAULT_SLOS: SLO[] = [
  {
    key: 'api_uptime',
    name: 'API uptime',
    target: 0.999,
    windowDays: 30,
    goodEventQuery: 'sum(http_requests_total{status!~"5.."})',
    totalEventQuery: 'sum(http_requests_total)',
  },
  {
    key: 'slo.page-load-tail',
    name: 'Page load p99 < 2s',
    target: 0.99,
    windowDays: 30,
    goodEventQuery: 'sum(page_load_total{le="2000"})',
    totalEventQuery: 'sum(page_load_total)',
  },
  {
    key: 'slo.agent-call-tail',
    name: 'Agent call p99 < 30s',
    target: 0.99,
    windowDays: 30,
    goodEventQuery: 'sum(agent_call_total{le="30000"})',
    totalEventQuery: 'sum(agent_call_total)',
  },
  {
    key: 'slo.cross-source-query-tail',
    name: 'Cross-source query p99 < 5s',
    target: 0.99,
    windowDays: 30,
    goodEventQuery: 'sum(search_hybrid_total{le="5000"})',
    totalEventQuery: 'sum(search_hybrid_total)',
  },
];

export function loadDefaultSLOs(tracker: SLOTracker): void {
  for (const slo of DEFAULT_SLOS) {
    tracker.register(slo);
  }
}
