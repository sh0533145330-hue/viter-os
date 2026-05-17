import { defineBlock } from '@vita/core';
import { z } from 'zod';

const dayOfWeekEnum = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

const inputs = z.object({
  now: z.string().datetime().optional(),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(0).max(23),
  daysOfWeek: z.array(dayOfWeekEnum).default(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']),
  timezoneOffsetMinutes: z.number().int().default(0),
});

const outputs = z.object({
  allow: z.boolean(),
  reason: z.string(),
  evaluatedAt: z.string(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

const WEEKDAY_INDEX: Record<z.infer<typeof dayOfWeekEnum>, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Allow execution only inside a daily window expressed in fixed-offset
 * minutes (UTC by default). Useful for business-hours guards.
 */
export const timeWindowGateBlock = defineBlock<Inputs, Outputs>({
  key: 'gate.time_window',
  category: 'gate',
  description: 'Allow execution only inside an hour/day window with a fixed UTC offset.',
  inputs,
  outputs,
  idempotent: true,
  handler: async (input) => {
    const base = input.now ? new Date(input.now) : new Date();
    if (Number.isNaN(base.getTime())) throw new Error(`Invalid 'now': ${input.now}`);
    const shifted = new Date(base.getTime() + input.timezoneOffsetMinutes * 60_000);
    const hour = shifted.getUTCHours();
    const day = shifted.getUTCDay();
    const allowedDays = new Set(input.daysOfWeek.map((d) => WEEKDAY_INDEX[d]));
    if (!allowedDays.has(day)) {
      return {
        allow: false,
        reason: `day ${day} not in allowed days`,
        evaluatedAt: base.toISOString(),
      };
    }
    const inHours =
      input.startHour <= input.endHour
        ? hour >= input.startHour && hour < input.endHour
        : hour >= input.startHour || hour < input.endHour;
    return {
      allow: inHours,
      reason: inHours ? 'within window' : 'outside hour window',
      evaluatedAt: base.toISOString(),
    };
  },
});
