import { defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  message: z.string().min(1),
  attributes: z.record(z.string(), z.unknown()).optional(),
  payload: z.unknown().optional(),
});

const outputs = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  payload: z.unknown().optional(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

/** Write a structured log line via the block context logger; pass payload through. */
export const logBlock = defineBlock<Inputs, Outputs>({
  key: 'utility.log',
  category: 'utility',
  description: 'Emit a structured log line and pass the payload through unchanged.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    const level = input.level;
    const attrs = input.attributes ?? {};
    if (level === 'debug') ctx.logger.debug?.(input.message, attrs);
    else if (level === 'warn') ctx.logger.warn(input.message, attrs);
    else if (level === 'error') ctx.logger.error(input.message, attrs);
    else ctx.logger.info(input.message, attrs);
    return {
      level,
      message: input.message,
      ...(input.payload !== undefined ? { payload: input.payload } : {}),
    };
  },
});
