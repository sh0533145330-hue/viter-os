import { describe, expect, it } from 'vitest';
import { SLOTracker, DEFAULT_SLOS, loadDefaultSLOs } from './slo.js';

describe('SLOTracker', () => {
  it('registers an SLO', () => {
    const tracker = new SLOTracker();
    tracker.register({
      key: 'test_slo',
      name: 'Test SLO',
      target: 0.999,
      windowDays: 30,
      goodEventQuery: 'good',
      totalEventQuery: 'total',
    });
    expect(tracker.listAll()).toHaveLength(1);
    expect(tracker.get('test_slo')?.target).toBe(0.999);
  });

  it('rejects invalid target (0 or 1)', () => {
    const tracker = new SLOTracker();
    expect(() =>
      tracker.register({ key: 'bad1', name: 'Bad', target: 0, windowDays: 30, goodEventQuery: '', totalEventQuery: '' })
    ).toThrow();
    expect(() =>
      tracker.register({ key: 'bad2', name: 'Bad', target: 1, windowDays: 30, goodEventQuery: '', totalEventQuery: '' })
    ).toThrow();
  });

  it('rejects non-positive windowDays', () => {
    const tracker = new SLOTracker();
    expect(() =>
      tracker.register({ key: 'bad3', name: 'Bad', target: 0.99, windowDays: 0, goodEventQuery: '', totalEventQuery: '' })
    ).toThrow();
  });

  it('evaluate returns healthy when well within budget', () => {
    const tracker = new SLOTracker();
    const slo = { key: 'api', name: 'API', target: 0.999, windowDays: 30, goodEventQuery: '', totalEventQuery: '' };
    // 4 bad out of 10000 = 0.04% error rate; allowed = 0.1%; budget spent = 40% → healthy
    const status = tracker.evaluate(slo, 9996, 10000);
    expect(status.key).toBe('api');
    expect(status.currentPct).toBeCloseTo(0.999, 2);
    expect(status.status).toBe('healthy');
    expect(status.errorBudgetRemaining).toBeGreaterThan(0.5);
  });

  it('evaluate returns warning at 80% budget consumed', () => {
    const tracker = new SLOTracker();
    const slo = { key: 'api', name: 'API', target: 0.999, windowDays: 30, goodEventQuery: '', totalEventQuery: '' };
    // 0.1% allowed error. To use 80% of that, error rate = 0.0008
    // good/total = 1 - 0.0008 = 0.9992
    const goodCount = 9992;
    const totalCount = 10000;
    const status = tracker.evaluate(slo, goodCount, totalCount);
    expect(status.status).toBe('warning');
    expect(status.errorBudgetSpentPct).toBeGreaterThanOrEqual(0.8);
  });

  it('evaluate returns breach when budget exhausted', () => {
    const tracker = new SLOTracker();
    const slo = { key: 'api', name: 'API', target: 0.999, windowDays: 30, goodEventQuery: '', totalEventQuery: '' };
    // Error rate >= allowed error rate → breach
    const status = tracker.evaluate(slo, 9980, 10000);
    expect(status.status).toBe('breach');
    expect(status.errorBudgetSpentPct).toBeGreaterThanOrEqual(1);
    expect(status.errorBudgetRemaining).toBe(0);
  });

  it('evaluate handles zero total events', () => {
    const tracker = new SLOTracker();
    const slo = { key: 'api', name: 'API', target: 0.999, windowDays: 30, goodEventQuery: '', totalEventQuery: '' };
    const status = tracker.evaluate(slo, 0, 0);
    expect(status.currentPct).toBe(1);
    expect(status.status).toBe('healthy');
  });

  it('evaluate throws on invalid counts', () => {
    const tracker = new SLOTracker();
    const slo = { key: 'api', name: 'API', target: 0.999, windowDays: 30, goodEventQuery: '', totalEventQuery: '' };
    expect(() => tracker.evaluate(slo, -1, 100)).toThrow();
    expect(() => tracker.evaluate(slo, 50, 40)).toThrow();
  });

  it('evaluateByKey delegates to evaluate', () => {
    const tracker = new SLOTracker();
    tracker.register({ key: 'api', name: 'API', target: 0.99, windowDays: 30, goodEventQuery: '', totalEventQuery: '' });
    const status = tracker.evaluateByKey('api', 990, 1000);
    expect(status).toBeDefined();
    expect(status!.currentPct).toBeCloseTo(0.99, 2);
  });

  it('evaluateByKey returns undefined for unknown key', () => {
    const tracker = new SLOTracker();
    expect(tracker.evaluateByKey('missing', 100, 100)).toBeUndefined();
  });

  it('burnRate calculates correctly', () => {
    const tracker = new SLOTracker();
    const slo = { key: 'api', name: 'API', target: 0.999, windowDays: 30, goodEventQuery: '', totalEventQuery: '' };
    // error rate = 0.002, allowed = 0.001 → burn rate = 2
    const rate = tracker.burnRate(slo, 9980, 10000);
    expect(rate).toBeCloseTo(2, 1);
  });

  it('burnRate returns 0 for zero total', () => {
    const tracker = new SLOTracker();
    const slo = { key: 'api', name: 'API', target: 0.999, windowDays: 30, goodEventQuery: '', totalEventQuery: '' };
    expect(tracker.burnRate(slo, 0, 0)).toBe(0);
  });
});

describe('DEFAULT_SLOS', () => {
  it('contains 4 default SLOs', () => {
    expect(DEFAULT_SLOS).toHaveLength(4);
  });

  it('includes api_uptime', () => {
    const api = DEFAULT_SLOS.find((s) => s.key === 'api_uptime');
    expect(api).toBeDefined();
    expect(api!.target).toBe(0.999);
  });
});

describe('loadDefaultSLOs', () => {
  it('loads all default SLOs into tracker', () => {
    const tracker = new SLOTracker();
    loadDefaultSLOs(tracker);
    expect(tracker.listAll()).toHaveLength(4);
  });
});
