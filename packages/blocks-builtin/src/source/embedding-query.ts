import { NotImplementedError, defineBlock } from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  query: z.string(),
  collection: z.string(),
  topK: z.number().int().positive().max(200).default(10),
  filters: z.record(z.string(), z.unknown()).optional(),
});

const outputs = z.object({
  hits: z.array(
    z.object({ id: z.string(), score: z.number(), payload: z.unknown(), distance: z.number() }),
  ),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface EmbeddingContext {
  embeddings?: { query(input: Inputs, workspaceId: string): Promise<Outputs> };
}

export const embeddingQueryBlock = defineBlock<Inputs, Outputs, EmbeddingContext>({
  key: 'source.embedding_query',
  category: 'source',
  description: 'Vector-similarity search via an embeddings index.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input, ctx) => {
    if (!ctx.embeddings) {
      throw new NotImplementedError('source.embedding_query requires ctx.embeddings');
    }
    return ctx.embeddings.query(input, ctx.workspaceId);
  },
});
