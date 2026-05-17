import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  agentKey: z.string(),
  input: z.unknown(),
  modelHint: z.enum(['cheap', 'best', 'oss']).optional(),
});

const outputs = z.object({
  output: z.unknown(),
  model: z.string(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  costCents: z.number().nonnegative(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface AgentRuntimeContext {
  agents?: { call(input: Inputs, workspaceId: string, abort: AbortSignal): Promise<Outputs> };
}

/** Invoke an agent via the injected agent runtime. */
export const callAgentBlock = defineBlock<Inputs, Outputs, AgentRuntimeContext>({
  key: 'agent.call',
  category: 'agent',
  description: 'Invoke an agent by key with an arbitrary input payload.',
  inputs,
  outputs,
  idempotent: false,
  timeoutMs: 120_000,
  handler: async (input, ctx) => {
    if (!ctx.agents) throw new NotImplementedError('agent.call requires ctx.agents');
    return ctx.agents.call(input, ctx.workspaceId, ctx.abort);
  },
});
