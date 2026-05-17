/**
 * Lineage Scribe librarian.
 *
 * Records the lineage of every fact, draft, and decision into the
 * workspace's `lineage` table so downstream citations stay accurate.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from '../prompt-paths.js';

const inputs = z.object({
  workspaceId: z.string(),
  artifact: z.object({
    kind: z.string(),
    id: z.string(),
    snapshot: z.string(),
  }),
  sources: z.array(
    z.object({
      sourceRef: z.string(),
      contribution: z.string(),
    }),
  ),
});

const outputs = z.object({
  lineageId: z.string(),
  sourceCount: z.number().int().nonnegative(),
});

export type LineageScribeInput = z.infer<typeof inputs>;
export type LineageScribeOutput = z.infer<typeof outputs>;

export const lineageScribe: AgentDefinition<LineageScribeInput, LineageScribeOutput> = defineAgent<
  LineageScribeInput,
  LineageScribeOutput
>({
  key: 'lineage-scribe',
  kind: 'librarian',
  requiresBoundary: false,
  description: 'Records lineage of facts, drafts, and decisions.',
  inputs,
  outputs,
  promptRef: loadPrompt(promptPath('librarian-generic.md')),
  model: 'anthropic:claude-3-5-haiku',
  tools: [],
  autonomy: { default: 'auto_with_veto', max: 'auto_with_veto' },
  version: 1,
  evalSuiteId: 'librarian.lineage-scribe.v1',
});
