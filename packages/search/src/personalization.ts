/**
 * PersonalizationRanker — apply Tom user prefs to a ranked list.
 *
 * Adjusts scores by topic preferences, source affinity, layer preferences,
 * and recency (when `data.createdAt` or `data.updatedAt` is available).
 * Pure function; deterministic given the same inputs.
 */

import type { LayerKind, UserPrefs } from './types.js';

export type { UserPrefs } from './types.js';

interface Personalizable {
  id: string;
  score?: number;
  layer?: string;
  data: Record<string, unknown>;
}

const MILLIS_PER_DAY = 86_400_000;

function parseTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : t;
  }
  if (value instanceof Date) return value.getTime();
  return null;
}

function topicScore(data: Record<string, unknown>, topics: Record<string, number>): number {
  let boost = 0;
  const tags = Array.isArray(data.tags) ? (data.tags as unknown[]) : [];
  for (const t of tags) {
    if (typeof t === 'string') {
      const w = topics[t.toLowerCase()];
      if (typeof w === 'number') boost += w;
    }
  }
  const topic = typeof data.topic === 'string' ? (data.topic as string).toLowerCase() : '';
  if (topic) {
    const w = topics[topic];
    if (typeof w === 'number') boost += w;
  }
  return boost;
}

function sourceScore(data: Record<string, unknown>, sources: Record<string, number>): number {
  const key = (() => {
    if (typeof data.source === 'string') return (data.source as string).toLowerCase();
    if (typeof data.sourceKind === 'string') return (data.sourceKind as string).toLowerCase();
    return '';
  })();
  if (!key) return 0;
  const w = sources[key];
  return typeof w === 'number' ? w : 0;
}

function recencyBoost(data: Record<string, unknown>, factor: number, now: number): number {
  const ts = parseTimestamp(data.updatedAt ?? data.createdAt);
  if (ts === null) return 0;
  const ageDays = Math.max(0, (now - ts) / MILLIS_PER_DAY);
  // Exponential decay: boost falls off with a 30-day half-life.
  return factor * Math.exp(-ageDays / 30);
}

function layerBoost(
  layer: string | undefined,
  weights: Partial<Record<LayerKind, number>>,
): number {
  if (!layer) return 0;
  const key = layer.toLowerCase() as LayerKind;
  const w = weights[key];
  return typeof w === 'number' ? w : 0;
}

export interface PersonalizeOptions {
  now?: number;
}

export function personalizeRanking<T extends Personalizable>(
  results: T[],
  prefs: UserPrefs,
  options: PersonalizeOptions = {},
): T[] {
  if (results.length === 0) return [];
  const now = options.now ?? Date.now();
  const topics = prefs.topics ?? {};
  const sources = prefs.sources ?? {};
  const recency = typeof prefs.recencyBoost === 'number' ? prefs.recencyBoost : 0;
  const layers = prefs.layerBoost ?? {};

  const scored = results.map((r) => {
    const base = typeof r.score === 'number' ? r.score : 0;
    const boost =
      topicScore(r.data, topics) +
      sourceScore(r.data, sources) +
      recencyBoost(r.data, recency, now) +
      layerBoost(r.layer, layers);
    return { item: r, finalScore: base + boost };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);
  return scored.map((s) => ({ ...s.item, score: s.finalScore }));
}

export class PersonalizationRanker {
  private readonly prefs: UserPrefs;

  constructor(prefs: UserPrefs) {
    this.prefs = prefs;
  }

  apply<T extends Personalizable>(results: T[], options?: PersonalizeOptions): T[] {
    return personalizeRanking(results, this.prefs, options ?? {});
  }
}
