/**
 * Entity Linker librarian.
 *
 * Reconciles raw mentions to canonical entities (people, orgs,
 * projects, deals). Runs in the data plane; never user-facing.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from '../prompt-paths.js';

const inputs = z.object({
  workspaceId: z.string(),
  mention: z.object({
    surface: z.string(),
    sourceRef: z.string(),
    contextSummary: z.string().optional(),
  }),
  candidateEntityIds: z.array(z.string()).default([]),
});

const outputs = z.object({
  matchedEntityId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  proposedNewEntity: z
    .object({
      kind: z.string(),
      displayName: z.string(),
      properties: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export type EntityLinkerInput = z.infer<typeof inputs>;
export type EntityLinkerOutput = z.infer<typeof outputs>;

export const entityLinker: AgentDefinition<EntityLinkerInput, EntityLinkerOutput> = defineAgent<
  EntityLinkerInput,
  EntityLinkerOutput
>({
  key: 'entity-linker',
  kind: 'librarian',
  requiresBoundary: false,
  description: 'Resolves raw mentions to canonical workspace entities.',
  inputs,
  outputs,
  promptRef: loadPrompt(promptPath('librarian-generic.md')),
  model: 'anthropic:claude-3-5-haiku',
  tools: [],
  autonomy: { default: 'auto_with_veto', max: 'auto_with_veto' },
  version: 1,
  evalSuiteId: 'librarian.entity-linker.v1',
});
