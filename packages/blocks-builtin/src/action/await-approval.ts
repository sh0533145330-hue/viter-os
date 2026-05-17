import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  proposalId: z.string(),
  timeoutMs: z.number().int().positive().optional(),
});

const outputs = z.object({
  approved: z.boolean(),
  decidedBy: z.string().optional(),
  decidedAt: z.string(),
  reason: z.string().optional(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface AwaitApprovalContext {
  actions?: {
    awaitApproval(input: Inputs, workspaceId: string, abort: AbortSignal): Promise<Outputs>;
  };
}

/** Block until a queued proposal is approved or rejected. */
export const awaitApprovalBlock = defineBlock<Inputs, Outputs, AwaitApprovalContext>({
  key: 'action.await_approval',
  category: 'action',
  description: 'Block until the named proposal is approved or rejected.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    if (!ctx.actions) throw new NotImplementedError('action.await_approval requires ctx.actions');
    return ctx.actions.awaitApproval(input, ctx.workspaceId, ctx.abort);
  },
});
