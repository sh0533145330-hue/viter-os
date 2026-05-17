import type { AlertRule, Severity } from './types.js';

export type { AlertRule } from './types.js';

export class AlertRuleRegistry {
  private readonly rules = new Map<string, AlertRule>();

  register(rule: AlertRule): void {
    if (this.rules.has(rule.key)) {
      throw new Error(`Alert rule ${rule.key} already registered`);
    }
    this.rules.set(rule.key, rule);
  }

  upsert(rule: AlertRule): void {
    this.rules.set(rule.key, rule);
  }

  list(): AlertRule[] {
    return [...this.rules.values()];
  }

  get(key: string): AlertRule | undefined {
    return this.rules.get(key);
  }

  bySeverity(severity: Severity): AlertRule[] {
    return this.list().filter((r) => r.severity === severity);
  }

  clear(): void {
    this.rules.clear();
  }
}

export const COMMON_ALERTS: AlertRule[] = [
  {
    key: 'error_spike',
    description: 'Error rate 5x baseline over 5m window',
    severity: 'critical',
    query: 'rate(errors_total[5m]) / rate(errors_total[1h] offset 1h) > 5',
    threshold: 5,
    duration: '5m',
    destinations: ['pagerduty', 'slack-incidents'],
    runbook: 'cross_tenant_leak_suspected',
  },
  {
    key: 'error_rate_sustained',
    description: 'Error rate 2x baseline sustained for 30m',
    severity: 'error',
    query: 'rate(errors_total[30m]) / rate(errors_total[1d] offset 1d) > 2',
    threshold: 2,
    duration: '30m',
    destinations: ['pagerduty', 'slack-incidents'],
  },
  {
    key: 'budget_breach_approaching',
    description: 'Workspace cost has reached 75% of cap',
    severity: 'warning',
    query: 'cost_meters.used_usd / cost_meters.cap_usd > 0.75',
    threshold: 0.75,
    duration: '5m',
    destinations: ['slack-incidents', 'email'],
    runbook: 'cost_circuit_breaker_tripped',
  },
  {
    key: 'budget_breach',
    description: 'Workspace cost has exceeded cap',
    severity: 'error',
    query: 'cost_meters.used_usd / cost_meters.cap_usd > 1.0',
    threshold: 1.0,
    duration: '1m',
    destinations: ['pagerduty', 'slack-incidents', 'email'],
    runbook: 'cost_circuit_breaker_tripped',
  },
  {
    key: 'eval_drift',
    description: 'Eval nDCG@3 dropped > 3% over 1 week',
    severity: 'warning',
    query: 'avg(eval_runs.ndcg_at_3[1w]) - avg(eval_runs.ndcg_at_3[1w] offset 1w) < -0.03',
    threshold: -0.03,
    duration: '1w',
    destinations: ['slack-eng-quality', 'email'],
    runbook: 'agent_eval_drift_detected',
  },
  {
    key: 'security_violation',
    description: 'Policy deny event without approval',
    severity: 'critical',
    query: 'sum(rate(policy_deny_total{action="boundary_send"}[5m])) > 0',
    threshold: 0,
    duration: '1m',
    destinations: ['pagerduty', 'slack-security'],
    runbook: 'cross_tenant_leak_suspected',
  },
  {
    key: 'agent_confidence_crash',
    description: 'Agent confidence below 0.3 for 10 consecutive runs',
    severity: 'warning',
    query: 'agent_runs.confidence < 0.3',
    threshold: 0.3,
    duration: '10m',
    destinations: ['slack-agent-health'],
    runbook: 'agent_eval_drift_detected',
  },
  {
    key: 'anonymization_failure',
    description: 'PII detected in cross-tenant output',
    severity: 'critical',
    query: 'sum(rate(anonymization_pii_leaked_total[5m])) > 0',
    threshold: 0,
    duration: '1m',
    destinations: ['pagerduty', 'slack-security'],
    runbook: 'anonymization_failure',
  },
  {
    key: 'queue_backlog',
    description: 'BullMQ queue depth above threshold for 10m',
    severity: 'error',
    query: 'queue_depth > 10000',
    threshold: 10000,
    duration: '10m',
    destinations: ['pagerduty', 'slack-incidents'],
    runbook: 'bullmq_redis_queue_backlog',
  },
  {
    key: 'slo_burn_fast',
    description: 'SLO burn rate above 14.4x (entire monthly budget in <2 days)',
    severity: 'critical',
    query: 'slo_burn_rate > 14.4',
    threshold: 14.4,
    duration: '1h',
    destinations: ['pagerduty', 'slack-incidents'],
  },
  {
    key: 'slo_burn_slow',
    description: 'SLO burn rate above 6x (entire monthly budget in <5 days)',
    severity: 'error',
    query: 'slo_burn_rate > 6',
    threshold: 6,
    duration: '6h',
    destinations: ['pagerduty', 'slack-incidents'],
  },
];

export function loadCommonAlerts(registry: AlertRuleRegistry): void {
  for (const rule of COMMON_ALERTS) {
    registry.upsert(rule);
  }
}
