import type { SyntheticColumn, SyntheticConfig } from './types.js';
import { syntheticConfigSchema } from './types.js';

/**
 * SyntheticGenerator produces synthetic rows matching a schema
 * but containing no real data. Useful for:
 * - Fallback when data can't be shared
 * - Testing with realistic schemas
 * - Privacy-preserving data sharing
 */
export class SyntheticGenerator {
  private readonly columns: SyntheticColumn[];
  private readonly rowCount: number;
  private readonly seed: number | undefined;

  constructor(config: SyntheticConfig) {
    const parsed = syntheticConfigSchema.parse(config);
    this.columns = parsed.columns;
    this.rowCount = parsed.rowCount;
    this.seed = parsed.seed;
  }

  /**
   * Generate synthetic rows.
   */
  generate(): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];
    // Simple seeded PRNG if seed provided
    let state = this.seed;
    const nextRandom = (): number => {
      if (state === undefined) return Math.random();
      // Mulberry32 PRNG
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = 0; i < this.rowCount; i++) {
      const row: Record<string, unknown> = {};
      for (const col of this.columns) {
        row[col.name] = this.generateValue(col, nextRandom, i);
      }
      rows.push(row);
    }

    return rows;
  }

  private generateValue(
    col: SyntheticColumn,
    rng: () => number,
    index: number,
  ): unknown {
    switch (col.type) {
      case 'string': {
        const maxLen =
          typeof col.constraints?.maxLength === 'number'
            ? (col.constraints.maxLength as number)
            : 20;
        return randomString(maxLen, rng);
      }
      case 'number': {
        const min =
          typeof col.constraints?.min === 'number'
            ? (col.constraints.min as number)
            : 0;
        const max =
          typeof col.constraints?.max === 'number'
            ? (col.constraints.max as number)
            : 1000;
        return min + rng() * (max - min);
      }
      case 'boolean':
        return rng() > 0.5;
      case 'date':
        return new Date(
          2000 + Math.floor(rng() * 30),
          Math.floor(rng() * 12),
          Math.floor(rng() * 27) + 1,
        ).toISOString();
      case 'email':
        return `user${index}_${Math.floor(rng() * 10000)}@synthetic.example.com`;
      case 'uuid':
        return generateFakeUuid(rng);
      case 'name':
        return `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`;
      default:
        return `synth_${index}`;
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────

function randomString(maxLen: number, rng: () => number): string {
  const len = Math.max(1, Math.floor(rng() * maxLen));
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(rng() * chars.length)];
  }
  return result;
}

function generateFakeUuid(rng: () => number): string {
  const hex = '0123456789abcdef';
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  let result = '';
  for (const ch of template) {
    if (ch === 'x') {
      result += hex[Math.floor(rng() * 16)];
    } else if (ch === 'y') {
      result += hex[(Math.floor(rng() * 4) & 0x3) | 0x8];
    } else {
      result += ch;
    }
  }
  return result;
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const FIRST_NAMES: readonly string[] = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah',
  'Ivan', 'Julia', 'Kevin', 'Laura', 'Michael', 'Nora', 'Oscar', 'Paula',
];

const LAST_NAMES: readonly string[] = [
  'Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Foster', 'Garcia', 'Harris',
  'Irwin', 'Johnson', 'King', 'Lee', 'Miller', 'Nelson', 'Owens', 'Parker',
];
