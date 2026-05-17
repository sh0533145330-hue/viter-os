/**
 * Conflict Resolver librarian.
 *
 * Detects and proposes resolutions for conflicting facts about the
 * same entity (e.g. two different titles for the same person).
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from '../prompt-paths.js';

const inputs = z.object({
  workspaceId: z.string(),
  entityId: z.string(),
  conflictingFacts: z.array(
    z.object({
      sourceRef: z.string(),
      property: z.string(),
      value: z.unknown(),
      observedAt: z.string(),
    }),
  ),
});

const outputs = z.object({
  resolution: z.enum(['merge', 'split', 'keep-latest', 'escalate']),
  chosenValue: z.unknown().optional(),
  rationale: z.string(),
  escalateToUserId: z.string().optional(),
});

export type ConflictResolverInput = z.infer<typeof inputs>;
export type ConflictResolverOutput = z.infer<typeof outputs>;

export const conflictResolver: AgentDefinition<ConflictResolverInput, ConflictResolverOutput> =
  defineAgent<ConflictResolverInput, ConflictResolverOutput>({
    key: 'conflict-resolver',
    kind: 'librarian',
    requiresBoundary: false,
    description: 'Detects and resolves conflicting facts about the same entity.',
    inputs,
    outputs,
    promptRef: loadPrompt(promptPath('librarian-generic.md')),
    model: 'anthropic:claude-3-5-haiku',
    tools: [],
    autonomy: { default: 'draft_confirm', max: 'auto_with_veto' },
    version: 1,
    evalSuiteId: 'librarian.conflict-resolver.v1',
  });
