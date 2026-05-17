import { defineBlock, evaluateJSONata } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  expression: z.string().min(1),
  data: z.unknown(),
  timeoutMs: z.number().int().positive().optional(),
});

const outputs = z.object({
  result: z.unknown(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

/** Run a JSONata expression against arbitrary input data. */
export const transformBlock = defineBlock<Inputs, Outputs>({
  key: 'utility.transform',
  category: 'utility',
  description: 'Evaluate a JSONata expression against arbitrary input data.',
  inputs,
  outputs,
  idempotent: true,
  timeoutMs: 5_000,
  handler: async (input) => {
    const r = await evaluateJSONata(
      input.expression,
      input.data,
      input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {},
    );
    if (!r.ok) {
      throw new Error(`JSONata ${r.error.code}: ${r.error.message}`);
    }
    return { result: r.value };
  },
});
