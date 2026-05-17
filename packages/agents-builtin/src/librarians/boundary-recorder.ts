/**
 * Boundary Recorder librarian.
 *
 * Listens for boundary acts emitted by Tom and persists them to
 * `tom_boundary_acts` with the prompt hash, autonomy level, and
 * recipient. Runs in the data plane.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from '../prompt-paths.js';

const inputs = z.object({
  workspaceId: z.string(),
  userId: z.string(),
  actKind: z.string(),
  target: z.string(),
  autonomy: z.enum(['suggest', 'draft_confirm', 'auto_with_limits', 'auto_with_veto']),
  promptHash: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  at: z.string(),
});

const outputs = z.object({
  recorded: z.boolean(),
  actId: z.string().optional(),
});

export type BoundaryRecorderInput = z.infer<typeof inputs>;
export type BoundaryRecorderOutput = z.infer<typeof outputs>;

export const boundaryRecorder: AgentDefinition<BoundaryRecorderInput, BoundaryRecorderOutput> =
  defineAgent<BoundaryRecorderInput, BoundaryRecorderOutput>({
    key: 'boundary-recorder',
    kind: 'librarian',
    requiresBoundary: false,
    description: 'Persists Tom boundary acts into the audit log.',
    inputs,
    outputs,
    promptRef: loadPrompt(promptPath('librarian-generic.md')),
    model: 'anthropic:claude-3-5-haiku',
    tools: [],
    autonomy: { default: 'auto_with_veto', max: 'auto_with_veto' },
    version: 1,
    evalSuiteId: 'librarian.boundary-recorder.v1',
  });
