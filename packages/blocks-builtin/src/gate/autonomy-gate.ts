import { defineBlock } from '@vita/core';
import { z } from 'zod';

const autonomyEnum = z.enum(['supervised', 'exceptions_only', 'weekly_review', 'autonomous']);

const inputs = z.object({
  currentLevel: autonomyEnum,
  requiredLevel: autonomyEnum,
  confidence: z.number().min(0).max(1).optional(),
  confidenceThreshold: z.number().min(0).max(1).default(0.8),
});

const outputs = z.object({
  allow: z.boolean(),
  reason: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

const RANK: Record<z.infer<typeof autonomyEnum>, number> = {
  supervised: 0,
  exceptions_only: 1,
  weekly_review: 2,
  autonomous: 3,
};

/**
 * Compare the skill's current autonomy level against the level required
 * for the current path. Optionally enforce a confidence threshold.
 */
export const autonomyGateBlock = defineBlock<Inputs, Outputs>({
  key: 'gate.autonomy',
  category: 'gate',
  description: 'Gate execution on the skill autonomy ladder + confidence threshold.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input) => {
    if (RANK[input.currentLevel] < RANK[input.requiredLevel]) {
      return {
        allow: false,
        reason: `autonomy ${input.currentLevel} below required ${input.requiredLevel}`,
      };
    }
    if (input.confidence !== undefined && input.confidence < input.confidenceThreshold) {
      return {
        allow: false,
        reason: `confidence ${input.confidence} < threshold ${input.confidenceThreshold}`,
      };
    }
    return { allow: true, reason: 'OK' };
  },
});
