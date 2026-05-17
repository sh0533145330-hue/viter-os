import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  principal: z.unknown(),
  action: z.string(),
  resource: z.unknown(),
  context: z.record(z.string(), z.unknown()).optional(),
});

const outputs = z.object({
  allow: z.boolean(),
  reason: z.string().optional(),
  policies: z.array(z.string()).optional(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface PolicyGateContext {
  authorize?: (input: Inputs) => Promise<Outputs> | Outputs;
}

/**
 * Delegate the authorization decision to an injected policy engine.
 * Keeps `@vita/blocks-builtin` decoupled from `@vita/policy`.
 */
export const policyGateBlock = defineBlock<Inputs, Outputs, PolicyGateContext>({
  key: 'gate.policy',
  category: 'gate',
  description: 'Delegate authorization to an injected policy engine.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.authorize) {
      throw new NotImplementedError('gate.policy requires ctx.authorize');
    }
    return ctx.authorize(input);
  },
});
