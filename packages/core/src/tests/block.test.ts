import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineBlock } from '../block.js';

describe('defineBlock', () => {
  it('accepts a well-formed block', () => {
    const block = defineBlock<{ value: string }, { value: string }>({
      key: 'utility.echo',
      category: 'utility',
      inputs: z.object({ value: z.string() }),
      outputs: z.object({ value: z.string() }),
      idempotent: true,
      handler: async (input) => ({ value: input.value }),
    });
    expect(block.key).toBe('utility.echo');
    expect(block.category).toBe('utility');
  });

  it('rejects invalid keys', () => {
    expect(() =>
      defineBlock({
        key: '!bad!',
        category: 'utility',
        inputs: z.any(),
        outputs: z.any(),
        idempotent: true,
        handler: async () => ({}),
      }),
    ).toThrow(/invalid/i);
  });

  it('rejects missing Zod input schema', () => {
    expect(() =>
      defineBlock({
        key: 'broken',
        category: 'utility',
        inputs: undefined as unknown as z.ZodTypeAny,
        outputs: z.any(),
        idempotent: false,
        handler: async () => ({}),
      }),
    ).toThrow(/Zod 'inputs'/);
  });

  it('rejects bad retry policy', () => {
    expect(() =>
      defineBlock({
        key: 'broken-retries',
        category: 'utility',
        inputs: z.any(),
        outputs: z.any(),
        idempotent: false,
        retries: { max: -1, backoffMs: 0 },
        handler: async () => ({}),
      }),
    ).toThrow(/retries.max/);
  });

  it('rejects non-positive timeout', () => {
    expect(() =>
      defineBlock({
        key: 'bad-timeout',
        category: 'utility',
        inputs: z.any(),
        outputs: z.any(),
        idempotent: false,
        timeoutMs: 0,
        handler: async () => ({}),
      }),
    ).toThrow(/timeoutMs/);
  });
});
