/**
 * Tim — team agent.
 *
 * Tim coordinates work across the people in a workspace. He never
 * crosses the boundary; outbound work is delivered as drafts to each
 * person's Tom.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from './prompt-paths.js';

const timInputs = z.object({
  instruction: z.string().min(1),
  scope: z
    .object({
      teamId: z.string().optional(),
      memberIds: z.array(z.string()).optional(),
    })
    .optional(),
});

const tomDraft = z.object({
  toUserId: z.string(),
  headline: z.string(),
  body: z.string(),
  citations: z.array(z.string()).default([]),
});

const timOutputs = z.object({
  summary: z.string(),
  tomDrafts: z.array(tomDraft).default([]),
  teamArtifacts: z
    .array(
      z.object({
        kind: z.string(),
        title: z.string(),
        body: z.string(),
      }),
    )
    .default([]),
  citations: z.array(z.string()).default([]),
});

export type TimInput = z.infer<typeof timInputs>;
export type TimOutput = z.infer<typeof timOutputs>;

export const tim: AgentDefinition<TimInput, TimOutput> = defineAgent<TimInput, TimOutput>({
  key: 'tim',
  kind: 'team',
  requiresBoundary: false,
  description: 'Team coordination agent. Synthesises across Toms; never crosses the boundary.',
  inputs: timInputs,
  outputs: timOutputs,
  promptRef: loadPrompt(promptPath('tim.md')),
  model: 'anthropic:claude-3-5-sonnet',
  tools: [],
  autonomy: { default: 'draft_confirm', max: 'auto_with_limits' },
  version: 1,
  evalSuiteId: 'tim.v1',
});
