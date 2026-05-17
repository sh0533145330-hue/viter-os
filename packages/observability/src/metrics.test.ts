import { describe, expect, it } from 'vitest';
import { MetricsRegistry } from './metrics.js';

describe('MetricsRegistry — Counter', () => {
  it('increments a counter', () => {
    const reg = new MetricsRegistry();
    const c = reg.counter('http_requests', 'Total HTTP requests');
    c.inc();
    c.inc();
    expect(c.get()).toBe(2);
  });

  it('increments by a custom value', () => {
    const reg = new MetricsRegistry();
    const c = reg.counter('bytes_sent', 'Bytes sent');
    c.inc(100);
    c.inc(50);
    expect(c.get()).toBe(150);
  });

  it('throws on negative increment', () => {
    const reg = new MetricsRegistry();
    const c = reg.counter('test_c', 'test');
    expect(() => c.inc(-1)).toThrow();
  });

  it('supports labels', () => {
    const reg = new MetricsRegistry();
    const c = reg.counter('requests', 'Requests', ['method']);
    c.inc(1, { method: 'GET' });
    c.inc(3, { method: 'POST' });
    c.inc(2, { method: 'GET' });
    expect(c.get({ method: 'GET' })).toBe(3);
    expect(c.get({ method: 'POST' })).toBe(3);
  });

  it('returns 0 for unset labels', () => {
    const reg = new MetricsRegistry();
    const c = reg.counter('test', 'test');
    expect(c.get()).toBe(0);
  });
});

describe('MetricsRegistry — Gauge', () => {
  it('sets a gauge value', () => {
    const reg = new MetricsRegistry();
    const g = reg.gauge('temperature', 'Current temp');
    g.set(72);
    expect(g.get()).toBe(72);
  });

  it('increments and decrements a gauge', () => {
    const reg = new MetricsRegistry();
    const g = reg.gauge('connections', 'Active connections');
    g.inc(5);
    expect(g.get()).toBe(5);
    g.dec(2);
    expect(g.get()).toBe(3);
  });

  it('supports labels on gauges', () => {
    const reg = new MetricsRegistry();
    const g = reg.gauge('queue_depth', 'Queue depth', ['queue']);
    g.set(10, { queue: 'email' });
    g.set(5, { queue: 'webhook' });
    expect(g.get({ queue: 'email' })).toBe(10);
    expect(g.get({ queue: 'webhook' })).toBe(5);
  });
});

describe('MetricsRegistry — Histogram', () => {
  it('observes values and produces snapshot', () => {
    const reg = new MetricsRegistry();
    const h = reg.histogram('latency_ms', 'Request latency');
    for (const v of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
      h.observe(v);
    }
    const snap = h.snapshot();
    expect(snap.count).toBe(10);
    expect(snap.sum).toBe(550);
    expect(snap.min).toBe(10);
    expect(snap.max).toBe(100);
    expect(snap.p50).toBeGreaterThanOrEqual(50);
    expect(snap.p95).toBeGreaterThanOrEqual(90);
    expect(snap.p99).toBeGreaterThanOrEqual(95);
  });

  it('returns zero snapshot for no observations', () => {
    const reg = new MetricsRegistry();
    const h = reg.histogram('empty', 'Empty');
    const snap = h.snapshot();
    expect(snap.count).toBe(0);
    expect(snap.sum).toBe(0);
  });

  it('supports labels on histograms', () => {
    const reg = new MetricsRegistry();
    const h = reg.histogram('duration', 'Duration', ['endpoint']);
    h.observe(100, { endpoint: '/api' });
    h.observe(200, { endpoint: '/api' });
    h.observe(50, { endpoint: '/health' });
    const apiSnap = h.snapshot({ endpoint: '/api' });
    expect(apiSnap.count).toBe(2);
    expect(apiSnap.sum).toBe(300);
  });
});

describe('MetricsRegistry — collect', () => {
  it('collects all metric series', () => {
    const reg = new MetricsRegistry();
    reg.counter('c1', 'Counter 1').inc(5);
    reg.gauge('g1', 'Gauge 1').set(42);
    const series = reg.collect();
    expect(series).toHaveLength(2);
    const counterSeries = series.find((s) => s.name === 'c1');
    expect(counterSeries?.type).toBe('counter');
    expect(counterSeries?.values[0]?.value).toBe(5);
    const gaugeSeries = series.find((s) => s.name === 'g1');
    expect(gaugeSeries?.type).toBe('gauge');
    expect(gaugeSeries?.values[0]?.value).toBe(42);
  });

  it('prevents duplicate metric name across types', () => {
    const reg = new MetricsRegistry();
    reg.counter('dup', 'Counter');
    expect(() => reg.gauge('dup', 'Gauge')).toThrow();
  });

  it('reset clears all metrics', () => {
    const reg = new MetricsRegistry();
    reg.counter('c', 'C').inc();
    reg.gauge('g', 'G').set(1);
    reg.reset();
    expect(reg.collect()).toHaveLength(0);
  });
});
