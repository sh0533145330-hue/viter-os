import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  entityType: z.string(),
  filter: z.record(z.string(), z.unknown()).optional(),
  limit: z.number().int().positive().max(1000).default(100),
});

const outputs = z.object({
  rows: z.array(z.record(z.string(), z.unknown())),
  fetchedAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface SourceL2Context {
  sources?: { fetchL2(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const l2FetchBlock = defineBlock<Inputs, Outputs, SourceL2Context>({
  key: 'source.fetch-entities',
  category: 'source',
  description: 'Fetch L2 ontology rows.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.sources) throw new NotImplementedError('source.l2_fetch requires ctx.sources');
    return ctx.sources.fetchL2(input, ctx.workspaceId);
  },
});
