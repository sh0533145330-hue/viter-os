import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const operation = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('create'),
    entityType: z.string(),
    data: z.record(z.string(), z.unknown()),
  }),
  z.object({
    op: z.literal('update'),
    entityType: z.string(),
    id: z.string(),
    patch: z.record(z.string(), z.unknown()),
  }),
  z.object({ op: z.literal('delete'), entityType: z.string(), id: z.string() }),
]);

const inputs = z.object({
  operations: z.array(operation).min(1).max(500),
  atomic: z.boolean().default(true),
});

const outputs = z.object({
  results: z.array(
    z.object({
      ok: z.boolean(),
      id: z.string().optional(),
      error: z.string().optional(),
    }),
  ),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface BatchContext {
  db?: { batchEntities(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const batchEntityBlock = defineBlock<Inputs, Outputs, BatchContext>({
  key: 'entity.batch',
  category: 'entity',
  description: 'Apply a batch of entity mutations atomically or best-effort.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    if (!ctx.db) throw new NotImplementedError('entity.batch requires ctx.db');
    return ctx.db.batchEntities(input, ctx.workspaceId);
  },
});
