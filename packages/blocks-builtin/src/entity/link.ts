import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  fromType: z.string(),
  fromId: z.string(),
  toType: z.string(),
  toId: z.string(),
  relation: z.string(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

const outputs = z.object({
  linkId: z.string(),
  createdAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface LinkContext {
  db?: { linkEntities(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const linkEntityBlock = defineBlock<Inputs, Outputs, LinkContext>({
  key: 'entity.link',
  category: 'entity',
  description: 'Create a typed link between two entity rows.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.db) throw new NotImplementedError('entity.link requires ctx.db');
    return ctx.db.linkEntities(input, ctx.workspaceId);
  },
});
