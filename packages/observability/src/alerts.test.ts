import { describe, expect, it } from 'vitest';
import { AlertRuleRegistry, COMMON_ALERTS, loadCommonAlerts } from './alerts.js';

describe('AlertRuleRegistry', () => {
  it('registers and retrieves a rule', () => {
    const reg = new AlertRuleRegistry();
    reg.register({
      key: 'test_rule',
      description: 'Test rule',
      severity: 'warning',
      query: 'rate(errors) > 0',
      threshold: 0,
      duration: '5m',
      destinations: ['slack'],
    });
    const rule = reg.get('test_rule');
    expect(rule).toBeDefined();
    expect(rule!.key).toBe('test_rule');
  });

  it('throws on duplicate registration', () => {
    const reg = new AlertRuleRegistry();
    reg.register({
      key: 'dup',
      description: 'First',
      severity: 'info',
      query: 'x > 0',
      threshold: 0,
      duration: '1m',
      destinations: [],
    });
    expect(() =>
      reg.register({
        key: 'dup',
        description: 'Second',
        severity: 'error',
        query: 'y > 0',
        threshold: 1,
        duration: '2m',
        destinations: [],
      })
    ).toThrow();
  });

  it('upsert replaces existing rule', () => {
    const reg = new AlertRuleRegistry();
    reg.register({
      key: 'upsert_test',
      description: 'v1',
      severity: 'info',
      query: 'x > 0',
      threshold: 0,
      duration: '1m',
      destinations: [],
    });
    reg.upsert({
      key: 'upsert_test',
      description: 'v2',
      severity: 'error',
      query: 'y > 0',
      threshold: 1,
      duration: '2m',
      destinations: ['pagerduty'],
    });
    const rule = reg.get('upsert_test');
    expect(rule!.description).toBe('v2');
    expect(rule!.severity).toBe('error');
  });

  it('list returns all rules', () => {
    const reg = new AlertRuleRegistry();
    reg.register({ key: 'a', description: 'A', severity: 'info', query: 'a', threshold: 0, duration: '1m', destinations: [] });
    reg.register({ key: 'b', description: 'B', severity: 'error', query: 'b', threshold: 0, duration: '1m', destinations: [] });
    expect(reg.list()).toHaveLength(2);
  });

  it('bySeverity filters rules', () => {
    const reg = new AlertRuleRegistry();
    reg.register({ key: 'c1', description: 'C1', severity: 'critical', query: 'c1', threshold: 0, duration: '1m', destinations: [] });
    reg.register({ key: 'w1', description: 'W1', severity: 'warning', query: 'w1', threshold: 0, duration: '1m', destinations: [] });
    expect(reg.bySeverity('critical')).toHaveLength(1);
    expect(reg.bySeverity('warning')).toHaveLength(1);
    expect(reg.bySeverity('info')).toHaveLength(0);
  });

  it('get returns undefined for unknown key', () => {
    const reg = new AlertRuleRegistry();
    expect(reg.get('nope')).toBeUndefined();
  });
});

describe('COMMON_ALERTS', () => {
  it('contains at least 10 alert rules', () => {
    expect(COMMON_ALERTS.length).toBeGreaterThanOrEqual(10);
  });

  it('every rule has required fields', () => {
    for (const rule of COMMON_ALERTS) {
      expect(rule.key).toBeTruthy();
      expect(rule.description).toBeTruthy();
      expect(['info', 'warning', 'error', 'critical']).toContain(rule.severity);
      expect(rule.query).toBeTruthy();
      expect(rule.threshold).toBeDefined();
      expect(rule.duration).toMatch(/^\d+[mhw]$/);
      expect(Array.isArray(rule.destinations)).toBe(true);
    }
  });

  it('includes key alert types', () => {
    const keys = COMMON_ALERTS.map((r) => r.key);
    expect(keys).toContain('error_spike');
    expect(keys).toContain('budget_breach_approaching');
    expect(keys).toContain('eval_drift');
    expect(keys).toContain('security_violation');
  });
});

describe('loadCommonAlerts', () => {
  it('loads all common alerts into a registry', () => {
    const reg = new AlertRuleRegistry();
    loadCommonAlerts(reg);
    expect(reg.list().length).toBe(COMMON_ALERTS.length);
  });
});
