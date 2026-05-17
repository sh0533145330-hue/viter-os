import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  actionKey: z.string(),
  payload: z.record(z.string(), z.unknown()),
  dryRun: z.boolean().default(false),
});

const outputs = z.object({
  actionId: z.string(),
  status: z.enum(['executed', 'dry_run', 'failed']),
  result: z.unknown().optional(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface ActionRuntimeContext {
  actions?: { invoke(input: Inputs, workspaceId: string): Promise<Outputs> };
}

/** Synchronously invoke a registered Action Type. */
export const invokeActionBlock = defineBlock<Inputs, Outputs, ActionRuntimeContext>({
  key: 'action.invoke',
  category: 'action',
  description: 'Invoke an Action Type by key with payload, optionally as a dry-run.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    if (!ctx.actions) throw new NotImplementedError('action.invoke requires ctx.actions');
    return ctx.actions.invoke(input, ctx.workspaceId);
  },
});
