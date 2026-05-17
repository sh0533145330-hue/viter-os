import { BlockCancelledError, defineBlock } from '@vita/core';
import { z } from 'zod';

const INT32_MAX = 2_147_483_647;
const MAX_MS = INT32_MAX - 5_000;

const inputs = z
  .object({
    ms: z.number().int().nonnegative().max(MAX_MS).optional(),
    until: z.string().datetime().optional(),
  })
  .refine((d) => d.ms !== undefined || d.until !== undefined, {
    message: "either 'ms' or 'until' must be supplied",
  });

const outputs = z.object({
  sleptMs: z.number().int().nonnegative(),
  wokeAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

/** Suspend execution for `ms` milliseconds or until the wall clock reaches `until`. */
export const sleepBlock = defineBlock<Inputs, Outputs>({
  key: 'utility.sleep',
  category: 'utility',
  description: 'Suspend execution for a fixed duration or until a wall-clock instant.',
  inputs,
  outputs,
  idempotent: true,
  timeoutMs: INT32_MAX,
  handler: async (input, ctx) => {
    const start = Date.now();
    let ms = input.ms ?? 0;
    if (input.until) {
      const target = Date.parse(input.until);
      if (Number.isNaN(target)) throw new Error(`Invalid 'until' timestamp: ${input.until}`);
      ms = Math.max(0, target - start);
    }
    ms = Math.min(ms, MAX_MS);
    if (ms === 0) {
      return { sleptMs: 0, wokeAt: new Date().toISOString() };
    }
    await new Promise<void>((resolve, reject) => {
      if (ctx.abort.aborted) {
        reject(new BlockCancelledError('Sleep cancelled'));
        return;
      }
      const timer = setTimeout(() => {
        cleanup();
        resolve();
      }, ms);
      timer.unref?.();
      const onAbort = () => {
        cleanup();
        reject(new BlockCancelledError('Sleep cancelled'));
      };
      function cleanup() {
        clearTimeout(timer);
        ctx.abort.removeEventListener('abort', onAbort);
      }
      ctx.abort.addEventListener('abort', onAbort, { once: true });
    });
    return { sleptMs: Date.now() - start, wokeAt: new Date().toISOString() };
  },
});
