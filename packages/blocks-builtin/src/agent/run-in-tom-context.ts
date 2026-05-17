import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  payload: z.unknown(),
  modelHint: z.enum(['cheap', 'best', 'oss']).optional(),
  scopeOverride: z.record(z.string(), z.unknown()).optional(),
});

const outputs = z.object({
  output: z.unknown(),
  tomTrace: z.string().optional(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface TomContext {
  agents?: {
    runInTomContext(input: Inputs, workspaceId: string, abort: AbortSignal): Promise<Outputs>;
  };
}

/** Invoke a payload with Tom's full ontology + ToM context attached. */
export const runInTomContextBlock = defineBlock<Inputs, Outputs, TomContext>({
  key: 'agent.run_in_tom_context',
  category: 'agent',
  description: "Run a payload through Tom's reasoning context.",
  inputs,
  outputs,
  idempotent: false,
  timeoutMs: 120_000,
  handler: async (input, ctx) => {
    if (!ctx.agents) {
      throw new NotImplementedError('agent.run_in_tom_context requires ctx.agents');
    }
    return ctx.agents.runInTomContext(input, ctx.workspaceId, ctx.abort);
  },
});
