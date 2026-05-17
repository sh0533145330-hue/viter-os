/**
 * Lex — legal specialist (stub).
 *
 * Reads documents, surfaces risk, and proposes redlines. Stub
 * definition; production prompt and tools will be wired in EP-08
 * follow-up tickets.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from './prompt-paths.js';

const lexInputs = z.object({
  document: z.string().min(1),
  jurisdiction: z.string().optional(),
  question: z.string().optional(),
});

const lexOutputs = z.object({
  summary: z.string(),
  redlines: z
    .array(
      z.object({
        clause: z.string(),
        concern: z.string(),
        severity: z.enum(['info', 'minor', 'major', 'blocking']),
        suggestedEdit: z.string().optional(),
      }),
    )
    .default([]),
  disclaimer: z.string().default('Lex is not a substitute for licensed counsel.'),
  citations: z.array(z.string()).default([]),
});

export type LexInput = z.infer<typeof lexInputs>;
export type LexOutput = z.infer<typeof lexOutputs>;

export const lex: AgentDefinition<LexInput, LexOutput> = defineAgent<LexInput, LexOutput>({
  key: 'lex',
  kind: 'specialist',
  requiresBoundary: false,
  description:
    'Legal specialist. Surfaces risk and proposes redlines; not a substitute for counsel.',
  inputs: lexInputs,
  outputs: lexOutputs,
  promptRef: loadPrompt(promptPath('lex.md')),
  model: 'anthropic:claude-3-5-sonnet',
  tools: [],
  autonomy: { default: 'suggest', max: 'draft_confirm' },
  version: 1,
  evalSuiteId: 'lex.v1',
});
