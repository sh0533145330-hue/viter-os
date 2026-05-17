/**
 * Hera — research specialist (stub).
 *
 * Investigates, synthesises, and cites. Stub definition; production
 * prompt and tools will be wired in EP-08 follow-up tickets.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from './prompt-paths.js';

const heraInputs = z.object({
  question: z.string().min(1),
  scope: z.enum(['web', 'workspace', 'mixed']).default('mixed'),
  freshnessHours: z.number().int().positive().optional(),
});

const heraOutputs = z.object({
  summary: z.string(),
  findings: z
    .array(
      z.object({
        claim: z.string(),
        evidence: z.string(),
        sourceRef: z.string(),
      }),
    )
    .default([]),
  citations: z.array(z.string()).default([]),
});

export type HeraInput = z.infer<typeof heraInputs>;
export type HeraOutput = z.infer<typeof heraOutputs>;

export const hera: AgentDefinition<HeraInput, HeraOutput> = defineAgent<HeraInput, HeraOutput>({
  key: 'hera',
  kind: 'specialist',
  requiresBoundary: false,
  description: 'Research specialist. Investigates, synthesises, and cites.',
  inputs: heraInputs,
  outputs: heraOutputs,
  promptRef: loadPrompt(promptPath('hera.md')),
  model: 'anthropic:claude-3-5-sonnet',
  tools: [],
  autonomy: { default: 'suggest', max: 'draft_confirm' },
  version: 1,
  evalSuiteId: 'hera.v1',
});
