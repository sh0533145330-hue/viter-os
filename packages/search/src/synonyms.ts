/**
 * Per-pack synonym, stop-word, and ranking-rule configuration.
 *
 * Packs (e.g. CEO/EA, founder, sales) ship search settings as part of their
 * vocabulary. `buildIndexSettings` merges multiple pack configurations into
 * a single Meilisearch settings payload.
 */

import type { IndexSettings, PackSynonyms } from './types.js';

export type { PackSynonyms } from './types.js';

const DEFAULT_RANKING_RULES: string[] = [
  'words',
  'typo',
  'proximity',
  'attribute',
  'sort',
  'exactness',
];

export function buildIndexSettings(packs: PackSynonyms[]): IndexSettings {
  const synonyms: Record<string, string[]> = {};
  const stopWords = new Set<string>();
  const rankingRules: string[] = [];
  let typoTolerance: IndexSettings['typoTolerance'];

  for (const pack of packs) {
    for (const [key, values] of Object.entries(pack.synonyms)) {
      const normalisedKey = key.toLowerCase().trim();
      if (!normalisedKey) continue;
      const merged = new Set(synonyms[normalisedKey] ?? []);
      for (const v of values) {
        const norm = v.toLowerCase().trim();
        if (norm) merged.add(norm);
      }
      synonyms[normalisedKey] = Array.from(merged);
    }
    for (const sw of pack.stopWords ?? []) {
      const norm = sw.toLowerCase().trim();
      if (norm) stopWords.add(norm);
    }
    if (pack.rankingRules) {
      for (const rule of pack.rankingRules) {
        if (!rankingRules.includes(rule)) rankingRules.push(rule);
      }
    }
    if (pack.typoTolerance && !typoTolerance) {
      typoTolerance = pack.typoTolerance;
    }
  }

  const finalRules = rankingRules.length > 0 ? rankingRules : DEFAULT_RANKING_RULES;

  const settings: IndexSettings = {
    synonyms,
    stopWords: Array.from(stopWords),
    rankingRules: finalRules,
  };
  if (typoTolerance !== undefined) settings.typoTolerance = typoTolerance;
  return settings;
}

/**
 * Expand a query using pack synonyms. Returns the original query plus an
 * OR-joined alternative for any whole-word synonym hits.
 */
export function expandQueryWithSynonyms(query: string, packs: PackSynonyms[]): string[] {
  const expansions = new Set<string>([query]);
  const lower = query.toLowerCase();
  for (const pack of packs) {
    for (const [key, values] of Object.entries(pack.synonyms)) {
      const k = key.toLowerCase();
      if (lower.includes(k)) {
        for (const v of values) {
          const replaced = lower.split(k).join(v.toLowerCase());
          expansions.add(replaced);
        }
      }
    }
  }
  return Array.from(expansions);
}
