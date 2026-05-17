import type { KAnonConfig, KAnonGroupResult, KAnonReport } from './types.js';
import { kAnonConfigSchema, kAnonReportSchema } from './types.js';

/**
 * KAnonymityChecker ensures that each group of rows (grouped by quasi-identifier columns)
 * has at least k members. If any group is smaller than k, it fails the k-anonymity check.
 */
export class KAnonymityChecker {
  private readonly k: number;
  private readonly quasiIdentifiers: string[];

  constructor(config: KAnonConfig | Partial<KAnonConfig>) {
    const parsed = kAnonConfigSchema.parse(config);

    // Apply domain defaults if k wasn't explicitly overridden
    if (config.k === undefined && parsed.domain !== 'general') {
      const domainDefaults: Record<string, number> = {
        healthcare: 100,
        legal: 100,
        financial: 100,
      };
      this.k = domainDefaults[parsed.domain] ?? 25;
    } else {
      this.k = parsed.k;
    }

    this.quasiIdentifiers = parsed.quasiIdentifiers;
  }

  /**
   * Run k-anonymity check on an array of rows.
   * Returns a report indicating pass/fail and details about failing groups.
   */
  check(rows: Record<string, unknown>[]): KAnonReport {
    // Group by quasi-identifier values
    const groups = new Map<string, Record<string, unknown>[]>();

    for (const row of rows) {
      const key = this.buildGroupKey(row);
      const existing = groups.get(key);
      if (existing) {
        existing.push(row);
      } else {
        groups.set(key, [row]);
      }
    }

    const groupResults: KAnonGroupResult[] = [];
    let failingCount = 0;

    for (const [keyStr, groupRows] of groups) {
      const count = groupRows.length;
      const passes = count >= this.k;
      const groupKey = this.parseGroupKey(keyStr);
      groupResults.push({ groupKey, count, passes });
      if (!passes) failingCount++;
    }

    const report = {
      passes: failingCount === 0 && rows.length > 0,
      totalRows: rows.length,
      groupCount: groupResults.length,
      failingGroups: groupResults.filter((g) => !g.passes),
      quasiIdentifiers: [...this.quasiIdentifiers],
      threshold: this.k,
    };

    return kAnonReportSchema.parse(report);
  }

  /**
   * Get the threshold k value.
   */
  getThreshold(): number {
    return this.k;
  }

  /**
   * Get the quasi-identifier column names.
   */
  getQuasiIdentifiers(): string[] {
    return [...this.quasiIdentifiers];
  }

  private buildGroupKey(row: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const col of this.quasiIdentifiers) {
      const val = row[col];
      parts.push(JSON.stringify(val ?? null));
    }
    return parts.join('|');
  }

  private parseGroupKey(key: string): Record<string, unknown> {
    const values = key.split('|');
    const result: Record<string, unknown> = {};
    for (let i = 0; i < this.quasiIdentifiers.length; i++) {
      const col = this.quasiIdentifiers[i]!;
      const raw = values[i] ?? 'null';
      try {
        result[col] = JSON.parse(raw);
      } catch {
        result[col] = raw;
      }
    }
    return result;
  }
}
