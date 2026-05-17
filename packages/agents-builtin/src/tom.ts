/**
 * Tom — the boundary agent.
 *
 * Tom is the only agent in VitaOS authorised to speak outside the
 * workspace on behalf of the user. Every outbound act flows through
 * `requiresBoundary: true` and is gated by the user's per-act autonomy
 * level. See `prompts/tom.md` for the canonical system prompt and
 * ADR-0004 for the rationale.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from './prompt-paths.js';

const tomInputs = z.object({
  /** Free-form instruction from the user or another agent. */
  instruction: z.string().min(1),
  /** Optional pre-resolved boundary intent the runtime will preflight. */
  boundaryActKind: z.string().optional(),
  boundaryTarget: z.string().optional(),
  /** Conversation context Tom should consider. */
  context: z
    .object({
      threadId: z.string().optional(),
      relatedCitations: z.array(z.string()).optional(),
    })
    .optional(),
});

const tomOutputs = z.object({
  reply: z.string(),
  proposalForMind: z
    .object({
      headline: z.string(),
      rationale: z.string(),
      draft: z.string(),
      citations: z.array(z.string()),
    })
    .optional(),
  citations: z.array(z.string()).default([]),
});

export type TomInput = z.infer<typeof tomInputs>;
export type TomOutput = z.infer<typeof tomOutputs>;

export const tom: AgentDefinition<TomInput, TomOutput> = defineAgent<TomInput, TomOutput>({
  key: 'tom',
  kind: 'boundary',
  requiresBoundary: true,
  description:
    'Personal boundary agent. Speaks in the user voice, only one allowed to cross the boundary.',
  inputs: tomInputs,
  outputs: tomOutputs,
  promptRef: loadPrompt(promptPath('tom.md')),
  model: 'anthropic:claude-3-5-sonnet',
  tools: [],
  autonomy: { default: 'draft_confirm', max: 'auto_with_veto' },
  version: 1,
  evalSuiteId: 'tom.v1',
  costBudgetCents: 50,
});
