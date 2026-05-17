import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  entityType: z.string().min(1),
  id: z.string().min(1),
  patch: z.record(z.string(), z.unknown()),
  expectedVersion: z.number().int().nonnegative().optional(),
});

const outputs = z.object({
  id: z.string(),
  entityType: z.string(),
  data: z.record(z.string(), z.unknown()),
  updatedAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface UpdateEntityContext {
  db?: {
    updateEntity(input: Inputs, workspaceId: string): Promise<Outputs>;
  };
}

export const updateEntityBlock = defineBlock<Inputs, Outputs, UpdateEntityContext>({
  key: 'entity.update',
  category: 'entity',
  description: 'Patch an entity row, optionally with an expected version for OCC.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    if (!ctx.db) throw new NotImplementedError('entity.update requires ctx.db');
    return ctx.db.updateEntity(input, ctx.workspaceId);
  },
});
