import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  entityType: z.string().min(1),
  id: z.string().min(1),
  soft: z.boolean().default(true),
});

const outputs = z.object({
  id: z.string(),
  deleted: z.boolean(),
  softDeleted: z.boolean(),
  deletedAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface DeleteEntityContext {
  db?: {
    deleteEntity(input: Inputs, workspaceId: string): Promise<Outputs>;
  };
}

export const deleteEntityBlock = defineBlock<Inputs, Outputs, DeleteEntityContext>({
  key: 'entity.delete',
  category: 'entity',
  description: 'Delete an entity row (soft or hard).',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.db) throw new NotImplementedError('entity.delete requires ctx.db');
    return ctx.db.deleteEntity(input, ctx.workspaceId);
  },
});
