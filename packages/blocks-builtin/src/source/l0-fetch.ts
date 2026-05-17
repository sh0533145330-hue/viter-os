import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  sourceKey: z.string(),
  filter: z.record(z.string(), z.unknown()).optional(),
  limit: z.number().int().positive().max(1000).default(100),
});

const outputs = z.object({
  rows: z.array(z.record(z.string(), z.unknown())),
  fetchedAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface SourceContext {
  sources?: { fetchL0(input: Inputs, workspaceId: string): Promise<Outputs> };
}

/** Fetch raw L0 source rows. */
export const l0FetchBlock = defineBlock<Inputs, Outputs, SourceContext>({
  key: 'source.fetch-raw-rows',
  category: 'source',
  description: 'Fetch raw L0 connector rows.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.sources) throw new NotImplementedError('source.l0_fetch requires ctx.sources');
    return ctx.sources.fetchL0(input, ctx.workspaceId);
  },
});
