import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  workflowKey: z.string(),
  filter: z.record(z.string(), z.unknown()).optional(),
  limit: z.number().int().positive().max(1000).default(100),
});

const outputs = z.object({
  rows: z.array(z.record(z.string(), z.unknown())),
  fetchedAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface SourceL3Context {
  sources?: { fetchL3(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const l3FetchBlock = defineBlock<Inputs, Outputs, SourceL3Context>({
  key: 'source.fetch-derived',
  category: 'source',
  description: 'Fetch L3 workflow run rows.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.sources) throw new NotImplementedError('source.l3_fetch requires ctx.sources');
    return ctx.sources.fetchL3(input, ctx.workspaceId);
  },
});
