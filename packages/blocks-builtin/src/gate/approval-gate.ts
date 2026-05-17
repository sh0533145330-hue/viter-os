import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  actionKey: z.string(),
  payload: z.unknown(),
  reviewers: z.array(z.string()).default([]),
  reason: z.string().optional(),
});

const outputs = z.object({
  approved: z.boolean(),
  approvedBy: z.string().optional(),
  decidedAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface ApprovalContext {
  requestApproval?: (input: Inputs, abort: AbortSignal) => Promise<Outputs>;
}

/** Block until a human reviewer approves or rejects the proposed action. */
export const approvalGateBlock = defineBlock<Inputs, Outputs, ApprovalContext>({
  key: 'gate.approval',
  category: 'gate',
  description: 'Block until a reviewer approves or rejects the proposed action.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    if (!ctx.requestApproval) {
      throw new NotImplementedError('gate.approval requires ctx.requestApproval');
    }
    return ctx.requestApproval(input, ctx.abort);
  },
});
