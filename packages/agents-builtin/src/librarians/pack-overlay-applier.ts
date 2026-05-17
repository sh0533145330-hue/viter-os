/**
 * Pack Overlay Applier librarian.
 *
 * Applies anonymized pack overlays from the marketplace into the
 * workspace's knowledge graph so insights flow without exposing
 * personal data.
 */

import { type AgentDefinition, defineAgent, loadPrompt, z } from '@vita/agents';
import { promptPath } from '../prompt-paths.js';

const inputs = z.object({
  workspaceId: z.string(),
  packId: z.string(),
  overlay: z.object({
    schemaRef: z.string(),
    items: z.array(z.record(z.string(), z.unknown())),
  }),
});

const outputs = z.object({
  appliedItemCount: z.number().int().nonnegative(),
  skippedItemCount: z.number().int().nonnegative(),
  warnings: z.array(z.string()).default([]),
});

export type PackOverlayApplierInput = z.infer<typeof inputs>;
export type PackOverlayApplierOutput = z.infer<typeof outputs>;

export const packOverlayApplier: AgentDefinition<
  PackOverlayApplierInput,
  PackOverlayApplierOutput
> = defineAgent<PackOverlayApplierInput, PackOverlayApplierOutput>({
  key: 'pack-overlay-applier',
  kind: 'librarian',
  requiresBoundary: false,
  description: 'Applies anonymized pack overlays into the workspace knowledge graph.',
  inputs,
  outputs,
  promptRef: loadPrompt(promptPath('librarian-generic.md')),
  model: 'anthropic:claude-3-5-haiku',
  tools: [],
  autonomy: { default: 'auto_with_veto', max: 'auto_with_veto' },
  version: 1,
  evalSuiteId: 'librarian.pack-overlay-applier.v1',
});
