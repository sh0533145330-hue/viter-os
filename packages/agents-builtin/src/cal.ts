/**
 * Cal — numbers specialist (stub).
 *
 * Reconciles, models, and explains quantitative claims. Stub
 * definition; production prompt and tools will be wired in EP-08
 * follow-up tickets.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from './prompt-paths.js';

const calInputs = z.object({
  question: z.string().min(1),
  dataRefs: z.array(z.string()).optional(),
});

const calOutputs = z.object({
  answer: z.string(),
  computations: z
    .array(
      z.object({
        label: z.string(),
        value: z.union([z.number(), z.string()]),
        sourceRef: z.string().optional(),
      }),
    )
    .default([]),
  citations: z.array(z.string()).default([]),
});

export type CalInput = z.infer<typeof calInputs>;
export type CalOutput = z.infer<typeof calOutputs>;

export const cal: AgentDefinition<CalInput, CalOutput> = defineAgent<CalInput, CalOutput>({
  key: 'cal',
  kind: 'specialist',
  requiresBoundary: false,
  description: 'Numbers specialist. Reconciles and explains quantitative claims.',
  inputs: calInputs,
  outputs: calOutputs,
  promptRef: loadPrompt(promptPath('cal.md')),
  model: 'anthropic:claude-3-5-sonnet',
  tools: [],
  autonomy: { default: 'suggest', max: 'draft_confirm' },
  version: 1,
  evalSuiteId: 'cal.v1',
});
