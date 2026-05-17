export interface Counter {
  inc(value?: number, labels?: Record<string, string>): void;
  get(labels?: Record<string, string>): number;
}

export interface Gauge {
  set(value: number, labels?: Record<string, string>): void;
  inc(value?: number, labels?: Record<string, string>): void;
  dec(value?: number, labels?: Record<string, string>): void;
  get(labels?: Record<string, string>): number;
}

export interface HistogramSnapshot {
  count: number;
  sum: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface Histogram {
  observe(value: number, labels?: Record<string, string>): void;
  snapshot(labels?: Record<string, string>): HistogramSnapshot;
}

export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricSeries {
  name: string;
  type: MetricType;
  help: string;
  values: Array<{
    labels: Record<string, string>;
    value: number | HistogramSnapshot;
  }>;
}

function labelsKey(labels: Record<string, string> | undefined, labelNames: string[]): string {
  if (!labels || labelNames.length === 0) return '';
  const pairs: string[] = [];
  for (const name of labelNames) {
    const v = labels[name] ?? '';
    pairs.push(`${name}=${v}`);
  }
  return pairs.join('|');
}

function labelsFromKey(key: string, labelNames: string[]): Record<string, string> {
  if (!key || labelNames.length === 0) return {};
  const out: Record<string, string> = {};
  const parts = key.split('|');
  for (let i = 0; i < labelNames.length; i++) {
    const name = labelNames[i]!;
    const part = parts[i] ?? '';
    const idx = part.indexOf('=');
    out[name] = idx >= 0 ? part.slice(idx + 1) : '';
  }
  return out;
}

class CounterImpl implements Counter {
  private readonly values = new Map<string, number>();
  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly labelNames: string[],
  ) {}

  inc(value = 1, labels?: Record<string, string>): void {
    if (value < 0) throw new Error(`Counter ${this.name} cannot be decremented`);
    const key = labelsKey(labels, this.labelNames);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  get(labels?: Record<string, string>): number {
    return this.values.get(labelsKey(labels, this.labelNames)) ?? 0;
  }

  entries(): Array<[string, number]> {
    return [...this.values.entries()];
  }
}

class GaugeImpl implements Gauge {
  private readonly values = new Map<string, number>();
  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly labelNames: string[],
  ) {}

  set(value: number, labels?: Record<string, string>): void {
    this.values.set(labelsKey(labels, this.labelNames), value);
  }

  inc(value = 1, labels?: Record<string, string>): void {
    const key = labelsKey(labels, this.labelNames);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  dec(value = 1, labels?: Record<string, string>): void {
    this.inc(-value, labels);
  }

  get(labels?: Record<string, string>): number {
    return this.values.get(labelsKey(labels, this.labelNames)) ?? 0;
  }

  entries(): Array<[string, number]> {
    return [...this.values.entries()];
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low]!;
  const fraction = rank - low;
  return sorted[low]! * (1 - fraction) + sorted[high]! * fraction;
}

class HistogramImpl implements Histogram {
  private readonly samples = new Map<string, number[]>();
  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly labelNames: string[],
  ) {}

  observe(value: number, labels?: Record<string, string>): void {
    const key = labelsKey(labels, this.labelNames);
    let bucket = this.samples.get(key);
    if (!bucket) {
      bucket = [];
      this.samples.set(key, bucket);
    }
    bucket.push(value);
  }

  snapshot(labels?: Record<string, string>): HistogramSnapshot {
    const key = labelsKey(labels, this.labelNames);
    const bucket = this.samples.get(key) ?? [];
    return this.computeSnapshot(bucket);
  }

  snapshotAll(): Array<[string, HistogramSnapshot]> {
    return [...this.samples.entries()].map(([k, v]) => [k, this.computeSnapshot(v)]);
  }

  private computeSnapshot(bucket: number[]): HistogramSnapshot {
    if (bucket.length === 0) {
      return { count: 0, sum: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }
    const sorted = [...bucket].sort((a, b) => a - b);
    let sum = 0;
    for (const v of sorted) sum += v;
    return {
      count: sorted.length,
      sum,
      min: sorted[0]!,
      max: sorted[sorted.length - 1]!,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    };
  }
}

type MetricImpl = CounterImpl | GaugeImpl | HistogramImpl;

export class MetricsRegistry {
  private readonly counters = new Map<string, CounterImpl>();
  private readonly gauges = new Map<string, GaugeImpl>();
  private readonly histograms = new Map<string, HistogramImpl>();

  counter(name: string, help: string, labelNames: string[] = []): Counter {
    this.assertUnused(name, 'counter');
    let m = this.counters.get(name);
    if (m) return m;
    m = new CounterImpl(name, help, labelNames);
    this.counters.set(name, m);
    return m;
  }

  gauge(name: string, help: string, labelNames: string[] = []): Gauge {
    this.assertUnused(name, 'gauge');
    let m = this.gauges.get(name);
    if (m) return m;
    m = new GaugeImpl(name, help, labelNames);
    this.gauges.set(name, m);
    return m;
  }

  histogram(name: string, help: string, labelNames: string[] = []): Histogram {
    this.assertUnused(name, 'histogram');
    let m = this.histograms.get(name);
    if (m) return m;
    m = new HistogramImpl(name, help, labelNames);
    this.histograms.set(name, m);
    return m;
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  collect(): MetricSeries[] {
    const out: MetricSeries[] = [];

    for (const c of this.counters.values()) {
      out.push({
        name: c.name,
        type: 'counter',
        help: c.help,
        values: c.entries().map(([k, v]) => ({
          labels: labelsFromKey(k, c.labelNames),
          value: v,
        })),
      });
    }
    for (const g of this.gauges.values()) {
      out.push({
        name: g.name,
        type: 'gauge',
        help: g.help,
        values: g.entries().map(([k, v]) => ({
          labels: labelsFromKey(k, g.labelNames),
          value: v,
        })),
      });
    }
    for (const h of this.histograms.values()) {
      out.push({
        name: h.name,
        type: 'histogram',
        help: h.help,
        values: h.snapshotAll().map(([k, snap]) => ({
          labels: labelsFromKey(k, h.labelNames),
          value: snap,
        })),
      });
    }
    return out;
  }

  private assertUnused(name: string, kind: MetricType): void {
    const found: Array<[MetricType, MetricImpl | undefined]> = [
      ['counter', this.counters.get(name)],
      ['gauge', this.gauges.get(name)],
      ['histogram', this.histograms.get(name)],
    ];
    for (const [k, m] of found) {
      if (m && k !== kind) {
        throw new Error(`Metric ${name} already registered as ${k}`);
      }
    }
  }
}

export const globalMetrics = new MetricsRegistry();
