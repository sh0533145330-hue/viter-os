import { defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  items: z.array(z.unknown()),
  maxConcurrency: z.number().int().positive().max(1000).default(5),
});

const outputs = z.object({
  results: z.array(z.unknown()),
  errors: z.array(
    z.object({ index: z.number().int().nonnegative(), code: z.string(), message: z.string() }),
  ),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface ForeachContext {
  runItem?: (item: unknown, index: number, abort: AbortSignal) => Promise<unknown>;
}

/**
 * Iterate `items` with a bounded concurrency window. The caller-supplied
 * `runItem` performs the actual work; failures are collected rather than
 * propagated so the workflow can decide how to react.
 */
export const foreachBlock = defineBlock<Inputs, Outputs, ForeachContext>({
  key: 'utility.foreach',
  category: 'utility',
  description: 'Apply a runItem function to each list item with bounded concurrency.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    const runner = ctx.runItem ?? (async (item: unknown) => item);
    const results: unknown[] = new Array(input.items.length);
    const errors: { index: number; code: string; message: string }[] = [];
    const queue: number[] = input.items.map((_, i) => i);
    const limit = Math.min(input.maxConcurrency, input.items.length);

    async function worker() {
      while (queue.length) {
        const idx = queue.shift();
        if (idx === undefined) break;
        if (ctx.abort.aborted) break;
        try {
          const item = input.items[idx];
          results[idx] = await runner(item, idx, ctx.abort);
        } catch (err) {
          const code =
            err instanceof Error && 'code' in err
              ? String((err as { code: unknown }).code)
              : 'UNKNOWN';
          const message = err instanceof Error ? err.message : String(err);
          errors.push({ index: idx, code, message });
        }
      }
    }

    await Promise.all(Array.from({ length: limit }, () => worker()));
    return { results, errors };
  },
});
