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

export interface SourceL1Context {
  sources?: { fetchL1(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const l1FetchBlock = defineBlock<Inputs, Outputs, SourceL1Context>({
  key: 'source.fetch-facts',
  category: 'source',
  description: 'Fetch L1 normalised rows.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.sources) throw new NotImplementedError('source.l1_fetch requires ctx.sources');
    return ctx.sources.fetchL1(input, ctx.workspaceId);
  },
});
