/**
 * Vocabulary Applier librarian.
 *
 * Applies the workspace's controlled vocabulary (canonical terms,
 * synonyms, banned phrasings) to incoming text so downstream agents
 * see normalised content.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from '../prompt-paths.js';

const inputs = z.object({
  workspaceId: z.string(),
  text: z.string(),
  domain: z.string().optional(),
});

const outputs = z.object({
  rewrittenText: z.string(),
  replacements: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        reason: z.string(),
      }),
    )
    .default([]),
});

export type VocabularyApplierInput = z.infer<typeof inputs>;
export type VocabularyApplierOutput = z.infer<typeof outputs>;

export const vocabularyApplier: AgentDefinition<VocabularyApplierInput, VocabularyApplierOutput> =
  defineAgent<VocabularyApplierInput, VocabularyApplierOutput>({
    key: 'vocabulary-applier',
    kind: 'librarian',
    requiresBoundary: false,
    description: 'Applies the workspace controlled vocabulary to incoming text.',
    inputs,
    outputs,
    promptRef: loadPrompt(promptPath('librarian-generic.md')),
    model: 'anthropic:claude-3-5-haiku',
    tools: [],
    autonomy: { default: 'auto_with_veto', max: 'auto_with_veto' },
    version: 1,
    evalSuiteId: 'librarian.vocabulary-applier.v1',
  });
