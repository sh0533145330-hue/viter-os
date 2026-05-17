import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  actionKey: z.string(),
  payload: z.record(z.string(), z.unknown()),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  approvers: z.array(z.string()).default([]),
});

const outputs = z.object({
  proposalId: z.string(),
  status: z.enum(['queued', 'auto_approved']),
  createdAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface ProposalContext {
  actions?: { propose(input: Inputs, workspaceId: string): Promise<Outputs> };
}

/** Queue an action for human review without invoking it. */
export const proposeActionBlock = defineBlock<Inputs, Outputs, ProposalContext>({
  key: 'action.propose',
  category: 'action',
  description: 'Queue a proposed action for human review or auto-approval.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    if (!ctx.actions) throw new NotImplementedError('action.propose requires ctx.actions');
    return ctx.actions.propose(input, ctx.workspaceId);
  },
});
