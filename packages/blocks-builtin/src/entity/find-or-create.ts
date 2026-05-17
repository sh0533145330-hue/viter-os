import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  entityType: z.string(),
  match: z.record(z.string(), z.unknown()),
  defaults: z.record(z.string(), z.unknown()).optional(),
});

const outputs = z.object({
  id: z.string(),
  created: z.boolean(),
  data: z.record(z.string(), z.unknown()),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface FindOrCreateContext {
  db?: { findOrCreateEntity(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const findOrCreateEntityBlock = defineBlock<Inputs, Outputs, FindOrCreateContext>({
  key: 'entity.find_or_create',
  category: 'entity',
  description: 'Look up an entity by match keys; insert with defaults if missing.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.db) throw new NotImplementedError('entity.find_or_create requires ctx.db');
    return ctx.db.findOrCreateEntity(input, ctx.workspaceId);
  },
});
