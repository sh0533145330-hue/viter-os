import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  entityType: z.string(),
  filter: z.record(z.string(), z.unknown()).optional(),
  sort: z.array(z.object({ field: z.string(), order: z.enum(['asc', 'desc']) })).optional(),
  limit: z.number().int().positive().max(1000).default(100),
  cursor: z.string().optional(),
});

const outputs = z.object({
  items: z.array(z.record(z.string(), z.unknown())),
  nextCursor: z.string().optional(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface QueryContext {
  db?: { queryEntities(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const queryEntityBlock = defineBlock<Inputs, Outputs, QueryContext>({
  key: 'entity.query',
  category: 'entity',
  description: 'Query the entity store with filter, sort, and cursor.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.db) throw new NotImplementedError('entity.query requires ctx.db');
    return ctx.db.queryEntities(input, ctx.workspaceId);
  },
});
