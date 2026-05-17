import { type BlockId, type RunId, type StepId, createEventBus, runBlock } from '@vita/core';
import { describe, expect, it } from 'vitest';
import { autonomyGateBlock, conditionalBlock, timeWindowGateBlock } from '../gate/index.js';

const baseOptions = {
  runId: 'run' as RunId,
  stepId: 'step' as StepId,
  blockId: 'block' as BlockId,
  workspaceId: 'ws',
};

describe('gate.conditional', () => {
  it('returns passed=true when predicate evaluates to true', async () => {
    const events = createEventBus();
    const out = await runBlock(
      conditionalBlock,
      { expression: '$.value > 5', data: { value: 9 } },
      { ...baseOptions, events },
    );
    expect(out.passed).toBe(true);
  });

  it('returns passed=false when predicate evaluates to false', async () => {
    const events = createEventBus();
    const out = await runBlock(
      conditionalBlock,
      { expression: '$.value > 5', data: { value: 1 } },
      { ...baseOptions, events },
    );
    expect(out.passed).toBe(false);
  });
});

describe('gate.autonomy', () => {
  it('blocks below required level', async () => {
    const events = createEventBus();
    const out = await runBlock(
      autonomyGateBlock,
      { currentLevel: 'supervised', requiredLevel: 'autonomous' },
      { ...baseOptions, events },
    );
    expect(out.allow).toBe(false);
  });

  it('allows when level meets requirement', async () => {
    const events = createEventBus();
    const out = await runBlock(
      autonomyGateBlock,
      { currentLevel: 'autonomous', requiredLevel: 'exceptions_only' },
      { ...baseOptions, events },
    );
    expect(out.allow).toBe(true);
  });

  it('blocks when confidence below threshold', async () => {
    const events = createEventBus();
    const out = await runBlock(
      autonomyGateBlock,
      {
        currentLevel: 'autonomous',
        requiredLevel: 'autonomous',
        confidence: 0.5,
        confidenceThreshold: 0.9,
      },
      { ...baseOptions, events },
    );
    expect(out.allow).toBe(false);
  });
});

describe('gate.time_window', () => {
  it('allows inside an hour window', async () => {
    const events = createEventBus();
    const out = await runBlock(
      timeWindowGateBlock,
      {
        now: '2026-05-13T14:00:00Z',
        startHour: 9,
        endHour: 17,
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timezoneOffsetMinutes: 0,
      },
      { ...baseOptions, events },
    );
    expect(out.allow).toBe(true);
  });

  it('blocks outside the window', async () => {
    const events = createEventBus();
    const out = await runBlock(
      timeWindowGateBlock,
      {
        now: '2026-05-13T22:00:00Z',
        startHour: 9,
        endHour: 17,
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timezoneOffsetMinutes: 0,
      },
      { ...baseOptions, events },
    );
    expect(out.allow).toBe(false);
  });

  it('blocks on disallowed days', async () => {
    const events = createEventBus();
    const out = await runBlock(
      timeWindowGateBlock,
      {
        now: '2026-05-10T14:00:00Z',
        startHour: 9,
        endHour: 17,
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timezoneOffsetMinutes: 0,
      },
      { ...baseOptions, events },
    );
    expect(out.allow).toBe(false);
  });
});
