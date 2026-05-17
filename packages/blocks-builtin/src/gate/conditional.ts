import { defineBlock, evaluateJSONata } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  expression: z.string().min(1),
  data: z.unknown(),
  timeoutMs: z.number().int().positive().optional(),
});

const outputs = z.object({
  passed: z.boolean(),
  value: z.unknown(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

/**
 * Evaluate a JSONata predicate against `data`. The block does not throw on
 * a false predicate — it returns `passed: false` so downstream branches
 * can react.
 */
export const conditionalBlock = defineBlock<Inputs, Outputs>({
  key: 'gate.conditional',
  category: 'gate',
  description: 'Evaluate a JSONata boolean expression and return passed=true/false.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input) => {
    const r = await evaluateJSONata(
      input.expression,
      input.data,
      input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {},
    );
    if (!r.ok) {
      throw new Error(`JSONata ${r.error.code}: ${r.error.message}`);
    }
    return { passed: Boolean(r.value), value: r.value };
  },
});
