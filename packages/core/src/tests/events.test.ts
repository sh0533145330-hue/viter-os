import { describe, expect, it } from 'vitest';
import { createEventBus } from '../events.js';
import type { BlockId, RunId, StepId } from '../events.js';

describe('EventBus', () => {
  it('routes typed events to typed handlers', () => {
    const bus = createEventBus();
    const seen: string[] = [];
    bus.on('block.started', (e) => seen.push(`started:${e.blockKey}`));
    bus.on('block.succeeded', (e) => seen.push(`ok:${e.blockKey}`));
    bus.emit({
      type: 'block.started',
      runId: 'r' as RunId,
      blockId: 'b' as BlockId,
      stepId: 's' as StepId,
      blockKey: 'x',
      at: '2026-01-01T00:00:00Z',
    });
    bus.emit({
      type: 'block.succeeded',
      runId: 'r' as RunId,
      blockId: 'b' as BlockId,
      stepId: 's' as StepId,
      blockKey: 'x',
      output: {},
      latencyMs: 1,
      at: '2026-01-01T00:00:00Z',
    });
    expect(seen).toEqual(['started:x', 'ok:x']);
  });

  it('replay returns events from a given index', () => {
    const bus = createEventBus();
    for (let i = 0; i < 3; i++) {
      bus.emit({
        type: 'block.started',
        runId: 'r' as RunId,
        blockId: `b${i}` as BlockId,
        stepId: 's' as StepId,
        blockKey: 'x',
        at: '2026-01-01T00:00:00Z',
      });
    }
    expect(bus.replay()).toHaveLength(3);
    expect(bus.replay(1)).toHaveLength(2);
  });

  it('onAny receives every event', () => {
    const bus = createEventBus();
    const types: string[] = [];
    bus.onAny((e) => types.push(e.type));
    bus.emit({
      type: 'run.started',
      runId: 'r' as RunId,
      workflowKey: 'w',
      workflowVersion: 1,
      workspaceId: 'ws',
      at: '2026-01-01T00:00:00Z',
    });
    bus.emit({
      type: 'run.succeeded',
      runId: 'r' as RunId,
      output: {},
      at: '2026-01-01T00:00:00Z',
    });
    expect(types).toEqual(['run.started', 'run.succeeded']);
  });

  it('returned unsubscribe stops delivery', () => {
    const bus = createEventBus();
    let count = 0;
    const off = bus.on('block.started', () => {
      count += 1;
    });
    bus.emit({
      type: 'block.started',
      runId: 'r' as RunId,
      blockId: 'b' as BlockId,
      stepId: 's' as StepId,
      blockKey: 'x',
      at: '2026-01-01T00:00:00Z',
    });
    off();
    bus.emit({
      type: 'block.started',
      runId: 'r' as RunId,
      blockId: 'b' as BlockId,
      stepId: 's' as StepId,
      blockKey: 'x',
      at: '2026-01-01T00:00:00Z',
    });
    expect(count).toBe(1);
  });
});
