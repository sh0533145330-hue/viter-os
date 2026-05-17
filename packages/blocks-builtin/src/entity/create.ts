import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  entityType: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().optional(),
});

const outputs = z.object({
  id: z.string(),
  entityType: z.string(),
  data: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface EntityContext {
  db?: {
    createEntity(input: Inputs, workspaceId: string): Promise<Outputs>;
  };
}

/** Insert a row into the entity store. */
export const createEntityBlock = defineBlock<Inputs, Outputs, EntityContext>({
  key: 'entity.create',
  category: 'entity',
  description: 'Create an entity row of the given type.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.db) throw new NotImplementedError('entity.create requires ctx.db');
    return ctx.db.createEntity(input, ctx.workspaceId);
  },
});
