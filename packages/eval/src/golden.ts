import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { type EvalCase, evalCaseSchema } from './types.js';

const goldenFileSchema = z.object({
  suite: z.string().optional(),
  description: z.string().optional(),
  cases: z.array(evalCaseSchema),
});

export type GoldenFile = z.infer<typeof goldenFileSchema>;

export interface LoadOptions {
  /** When true, recurse into subdirectories. */
  readonly recursive?: boolean;
  /** When provided, only include cases whose tags include at least one of these. */
  readonly tags?: readonly string[];
}

/**
 * Loads golden eval cases from JSON files. Each file must match
 * { suite?, description?, cases: EvalCase[] }.
 */
export class GoldenSetLoader {
  private readonly cases: EvalCase[] = [];

  /** Load a single JSON file and return its parsed cases. */
  async loadFile(filePath: string): Promise<EvalCase[]> {
    const raw = await readFile(filePath, 'utf8');
    return this.parse(raw, filePath);
  }

  /** Load all .json files in a directory. */
  async loadDirectory(dir: string, options: LoadOptions = {}): Promise<EvalCase[]> {
    const collected: EvalCase[] = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (options.recursive) {
          collected.push(...(await this.loadDirectory(full, options)));
        }
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith('.json')) continue;
      const cases = await this.loadFile(full);
      collected.push(...cases);
    }
    if (options.tags && options.tags.length > 0) {
      const wanted = new Set(options.tags);
      return collected.filter((c) => (c.tags ? c.tags.some((t) => wanted.has(t)) : false));
    }
    return collected;
  }

  /** Parse JSON content into typed EvalCase[]. */
  parse(rawJson: string, sourceLabel?: string): EvalCase[] {
    let data: unknown;
    try {
      data = JSON.parse(rawJson);
    } catch (err) {
      const where = sourceLabel ? ` in ${sourceLabel}` : '';
      throw new Error(`Failed to parse golden JSON${where}: ${(err as Error).message}`);
    }
    const parsed = goldenFileSchema.parse(data);
    const list = parsed.cases as EvalCase[];
    this.cases.push(...list);
    return list;
  }

  /** Return all cases collected so far. */
  all(): EvalCase[] {
    return [...this.cases];
  }

  /** Filter cases by tag. */
  byTag(tag: string): EvalCase[] {
    return this.cases.filter((c) => c.tags?.includes(tag) ?? false);
  }

  /** Clear all loaded cases. */
  clear(): void {
    this.cases.length = 0;
  }
}
