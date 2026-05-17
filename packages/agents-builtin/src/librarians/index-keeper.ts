/**
 * Index Keeper librarian.
 *
 * Maintains the workspace's search and embedding indexes — inserts,
 * deletes, and reindexes when entities or facts change.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from '../prompt-paths.js';

const inputs = z.object({
  workspaceId: z.string(),
  changes: z.array(
    z.object({
      action: z.enum(['insert', 'update', 'delete']),
      kind: z.string(),
      id: z.string(),
      body: z.string().optional(),
    }),
  ),
});

const outputs = z.object({
  appliedCount: z.number().int().nonnegative(),
  failures: z
    .array(
      z.object({
        id: z.string(),
        reason: z.string(),
      }),
    )
    .default([]),
});

export type IndexKeeperInput = z.infer<typeof inputs>;
export type IndexKeeperOutput = z.infer<typeof outputs>;

export const indexKeeper: AgentDefinition<IndexKeeperInput, IndexKeeperOutput> = defineAgent<
  IndexKeeperInput,
  IndexKeeperOutput
>({
  key: 'index-keeper',
  kind: 'librarian',
  requiresBoundary: false,
  description: 'Maintains search and embedding indexes for the workspace.',
  inputs,
  outputs,
  promptRef: loadPrompt(promptPath('librarian-generic.md')),
  model: 'anthropic:claude-3-5-haiku',
  tools: [],
  autonomy: { default: 'auto_with_veto', max: 'auto_with_veto' },
  version: 1,
  evalSuiteId: 'librarian.index-keeper.v1',
});
