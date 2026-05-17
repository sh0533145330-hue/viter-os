import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  domain: z.string(),
  candidates: z.array(z.string()).min(1),
  payload: z.unknown(),
});

const outputs = z.object({
  routedTo: z.string(),
  reason: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface RouterContext {
  agents?: { route(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const routeToSpecialistBlock = defineBlock<Inputs, Outputs, RouterContext>({
  key: 'agent.route_to_specialist',
  category: 'agent',
  description: 'Pick the best specialist agent for the given domain + payload.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    if (!ctx.agents) {
      throw new NotImplementedError('agent.route_to_specialist requires ctx.agents');
    }
    return ctx.agents.route(input, ctx.workspaceId);
  },
});
