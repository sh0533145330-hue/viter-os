import { BlockCancelledError, defineBlock } from '@vita/core';
import { z } from 'zod';

const branchInput = z.object({
  key: z.string().min(1),
  run: z.unknown(),
});

const inputs = z.object({
  branches: z.array(branchInput).min(1),
  failFast: z.boolean().default(false),
});

const outputs = z.object({
  results: z.record(z.string(), z.unknown()),
  errors: z.record(z.string(), z.object({ code: z.string(), message: z.string() })),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

/** Branch handler the caller supplies via `extraContext`. */
export interface ParallelContext {
  runBranch?: (key: string, payload: unknown, abort: AbortSignal) => Promise<unknown>;
}

/**
 * Execute branches concurrently. Each branch's `run` payload is forwarded
 * to the caller-supplied `runBranch`. Falls back to identity when no
 * delegate is configured, which is useful for tests that only need to
 * verify aggregation.
 */
export const parallelBlock = defineBlock<Inputs, Outputs, ParallelContext>({
  key: 'utility.parallel',
  category: 'utility',
  description: 'Run named branches concurrently and aggregate their results.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    const results: Record<string, unknown> = {};
    const errors: Record<string, { code: string; message: string }> = {};
    const childAborts: AbortController[] = [];
    const failFast = input.failFast;

    const runner = ctx.runBranch ?? (async (_k: string, payload: unknown) => payload);

    await Promise.all(
      input.branches.map(async (branch) => {
        const branchAbort = new AbortController();
        childAborts.push(branchAbort);
        const onParentAbort = () => branchAbort.abort();
        ctx.abort.addEventListener('abort', onParentAbort, { once: true });
        try {
          const value = await runner(branch.key, branch.run, branchAbort.signal);
          results[branch.key] = value;
        } catch (err) {
          const code =
            err instanceof Error && 'code' in err
              ? String((err as { code: unknown }).code)
              : 'UNKNOWN';
          const message = err instanceof Error ? err.message : String(err);
          errors[branch.key] = { code, message };
          if (failFast) {
            for (const child of childAborts) child.abort(new BlockCancelledError('failFast'));
          }
        } finally {
          ctx.abort.removeEventListener('abort', onParentAbort);
        }
      }),
    );

    return { results, errors };
  },
});
