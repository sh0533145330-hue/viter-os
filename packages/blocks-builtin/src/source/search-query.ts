import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  query: z.string(),
  index: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  limit: z.number().int().positive().max(100).default(10),
});

const outputs = z.object({
  hits: z.array(z.object({ id: z.string(), score: z.number(), payload: z.unknown() })),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface SearchContext {
  search?: { query(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const searchQueryBlock = defineBlock<Inputs, Outputs, SearchContext>({
  key: 'source.search_query',
  category: 'source',
  description: 'Full-text search across an index.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.search) throw new NotImplementedError('source.search_query requires ctx.search');
    return ctx.search.query(input, ctx.workspaceId);
  },
});
