/**
 * Deny — design specialist.
 *
 * Deny critiques visual artefacts, proposes concrete revisions, and
 * cross-references the workspace brand book. Never crosses the boundary.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from './prompt-paths.js';

const severity = z.enum(['info', 'minor', 'major', 'blocking']);

const denyInputs = z.object({
  artifact: z.object({
    kind: z.enum(['image', 'spec', 'markdown', 'figma']),
    payload: z.string(),
  }),
  brief: z.string().optional(),
  brandBookRef: z.string().optional(),
});

const finding = z.object({
  heuristic: z.string(),
  observation: z.string(),
  severity,
  suggestion: z.string(),
  citations: z.array(z.string()).default([]),
});

const denyOutputs = z.object({
  summary: z.string(),
  findings: z.array(finding).default([]),
  nextSteps: z.array(z.string()).default([]),
});

export type DenyInput = z.infer<typeof denyInputs>;
export type DenyOutput = z.infer<typeof denyOutputs>;

export const deny: AgentDefinition<DenyInput, DenyOutput> = defineAgent<DenyInput, DenyOutput>({
  key: 'deny',
  kind: 'specialist',
  requiresBoundary: false,
  description: 'Design specialist. Produces structured critiques and concrete proposals.',
  inputs: denyInputs,
  outputs: denyOutputs,
  promptRef: loadPrompt(promptPath('deny.md')),
  model: 'anthropic:claude-3-5-sonnet',
  tools: [],
  autonomy: { default: 'suggest', max: 'draft_confirm' },
  version: 1,
  evalSuiteId: 'deny.v1',
});
