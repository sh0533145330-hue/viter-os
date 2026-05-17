export interface QuasiRow {
  readonly [key: string]: unknown;
}

export interface AnonymizationFuzzConfig {
  readonly quasiIdentifiers: readonly string[];
  readonly k: number;
}

export interface ReidAttempt {
  readonly groupKey: string;
  readonly groupSize: number;
}

export interface AnonymizationFuzzReport {
  readonly attempts: readonly ReidAttempt[];
  readonly unsafeGroups: readonly ReidAttempt[];
  readonly passed: boolean;
}

/**
 * Runs a basic re-identification attack against a k-anonymized dataset by
 * grouping rows on quasi-identifier columns and flagging any group of size
 * less than `k`.
 */
export class AnonymizationFuzz {
  private readonly quasiIdentifiers: readonly string[];
  private readonly k: number;

  constructor(config: AnonymizationFuzzConfig) {
    if (config.k < 1) throw new Error('k must be >= 1');
    if (config.quasiIdentifiers.length === 0) {
      throw new Error('quasiIdentifiers must be non-empty');
    }
    this.quasiIdentifiers = config.quasiIdentifiers;
    this.k = config.k;
  }

  run(rows: readonly QuasiRow[]): AnonymizationFuzzReport {
    const groups = new Map<string, number>();
    for (const row of rows) {
      const key = this.quasiIdentifiers.map((c) => JSON.stringify(row[c] ?? null)).join('|');
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
    const attempts: ReidAttempt[] = [];
    const unsafeGroups: ReidAttempt[] = [];
    for (const [groupKey, groupSize] of groups) {
      const attempt: ReidAttempt = { groupKey, groupSize };
      attempts.push(attempt);
      if (groupSize < this.k) unsafeGroups.push(attempt);
    }
    return { attempts, unsafeGroups, passed: unsafeGroups.length === 0 };
  }
}
