/**
 * Anonymizer librarian.
 *
 * Strips personally-identifying detail from artefacts before they
 * leave the workspace boundary (e.g. when building a pack overlay).
 * Delegates the heavy lifting to `@vita/anonymization`; the API is
 * injected by the host so this package stays lightweight.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from '../prompt-paths.js';

const inputs = z.object({
  workspaceId: z.string(),
  artifact: z.object({
    kind: z.string(),
    body: z.string(),
  }),
  level: z.enum(['light', 'standard', 'strict']).default('standard'),
});

const outputs = z.object({
  anonymizedBody: z.string(),
  redactionCount: z.number().int().nonnegative(),
  warnings: z.array(z.string()).default([]),
});

export type AnonymizerInput = z.infer<typeof inputs>;
export type AnonymizerOutput = z.infer<typeof outputs>;

/**
 * Surface area expected from `@vita/anonymization`. The concrete
 * implementation is injected at runtime so this builtin definition does
 * not pull the anonymizer's dependencies into every consumer.
 */
export interface AnonymizationApi {
  redact(
    body: string,
    level: 'light' | 'standard' | 'strict',
  ): Promise<{
    body: string;
    redactionCount: number;
    warnings: string[];
  }>;
}

export const anonymizer: AgentDefinition<AnonymizerInput, AnonymizerOutput> = defineAgent<
  AnonymizerInput,
  AnonymizerOutput
>({
  key: 'anonymizer',
  kind: 'librarian',
  requiresBoundary: false,
  description: 'Removes personally-identifying detail before artefacts leave the workspace.',
  inputs,
  outputs,
  promptRef: loadPrompt(promptPath('librarian-generic.md')),
  model: 'anthropic:claude-3-5-haiku',
  tools: [],
  autonomy: { default: 'auto_with_veto', max: 'auto_with_veto' },
  version: 1,
  evalSuiteId: 'librarian.anonymizer.v1',
  metadata: { requires: ['@vita/anonymization'] },
});
