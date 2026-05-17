/**
 * `@vita/pack-sdk` — Vocabulary layer: label overrides per pack, per locale.
 *
 * When a pack is deployed, it may ship `label_overrides` rows that rename
 * ObjectType / LinkType labels for a particular locale. The VocabularyResolver
 * resolves the effective label for a given key by merging all active overrides
 * for the workspace (public → agency → workspace priority).
 */

import type { LabelOverride } from './types.js';

// ---------------------------------------------------------------------------
// Vocabulary entry
// ---------------------------------------------------------------------------

export interface VocabularyEntry {
  labelSingular?: string | undefined;
  labelPlural?: string | undefined;
}

// ---------------------------------------------------------------------------
// Vocabulary resolver
// ---------------------------------------------------------------------------

export class VocabularyResolver {
  /** Map of key → locale → { labelSingular, labelPlural } (merged for workspace) */
  private overrides: Map<string, Map<string, VocabularyEntry>>;

  constructor() {
    this.overrides = new Map();
  }

  /**
   * Register label overrides from a pack deployment.
   * Each override is keyed by (key, locale). Higher priority (lower index)
   * overrides are applied first, so add them in priority order.
   */
  addOverrides(overrides: LabelOverride[]): void {
    for (const ov of overrides) {
      const locale = ov.locale ?? 'en-US';
      let localeMap = this.overrides.get(ov.key);
      if (!localeMap) {
        localeMap = new Map();
        this.overrides.set(ov.key, localeMap);
      }

      const existing = localeMap.get(locale);
      localeMap.set(locale, {
        labelSingular: ov.labelSingular ?? existing?.labelSingular,
        labelPlural: ov.labelPlural ?? existing?.labelPlural,
      });
    }
  }

  /**
   * Resolve the effective label(s) for a given key and locale.
   * Returns undefined if no overrides exist.
   */
  resolve(key: string, locale: string = 'en-US'): VocabularyEntry | undefined {
    const localeMap = this.overrides.get(key);
    if (!localeMap) return undefined;
    return localeMap.get(locale);
  }

  /**
   * Get the label singular or return the fallback.
   */
  labelSingular(
    key: string,
    fallback: string,
    locale: string = 'en-US',
  ): string {
    const entry = this.resolve(key, locale);
    return entry?.labelSingular ?? fallback;
  }

  /**
   * Get the label plural or return the fallback.
   */
  labelPlural(key: string, fallback: string, locale: string = 'en-US'): string {
    const entry = this.resolve(key, locale);
    return entry?.labelPlural ?? fallback;
  }

  /**
   * Clear all overrides (useful for testing).
   */
  clear(): void {
    this.overrides.clear();
  }

  /**
   * Get the number of registered overrides across all keys/locales.
   */
  get size(): number {
    let count = 0;
    for (const localeMap of this.overrides.values()) {
      count += localeMap.size;
    }
    return count;
  }
}
