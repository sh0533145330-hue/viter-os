import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineBlock } from '../block.js';
import { WorkflowGraphError } from '../errors.js';
import { createEventBus } from '../events.js';
import type { RunId } from '../events.js';
import { defineWorkflow, runWorkflow } from '../workflow.js';

const addBlock = defineBlock<{ a: number; b: number }, { sum: number }>({
  key: 'utility.add',
  category: 'utility',
  inputs: z.object({ a: z.number(), b: z.number() }),
  outputs: z.object({ sum: z.number() }),
  idempotent: true,
  handler: async (input) => ({ sum: input.a + input.b }),
});

const doubleBlock = defineBlock<{ value: number }, { value: number }>({
  key: 'utility.double',
  category: 'utility',
  inputs: z.object({ value: z.number() }),
  outputs: z.object({ value: z.number() }),
  idempotent: true,
  handler: async (input) => ({ value: input.value * 2 }),
});

describe('defineWorkflow', () => {
  it('rejects duplicate block ids', () => {
    expect(() =>
      defineWorkflow({
        key: 'wf.bad',
        version: 1,
        inputs: z.any(),
        outputs: z.any(),
        blocks: [
          { id: 'a', block: addBlock },
          { id: 'a', block: addBlock },
        ],
        wires: [],
      }),
    ).toThrow(WorkflowGraphError);
  });

  it('rejects wires referencing missing blocks', () => {
    expect(() =>
      defineWorkflow({
        key: 'wf.bad2',
        version: 1,
        inputs: z.any(),
        outputs: z.any(),
        blocks: [{ id: 'a', block: addBlock }],
        wires: [{ from: { blockId: 'a', port: 'sum' }, to: { blockId: 'missing', port: 'value' } }],
      }),
    ).toThrow(WorkflowGraphError);
  });
});

describe('runWorkflow', () => {
  it('executes a single block', async () => {
    const wf = defineWorkflow({
      key: 'wf.single',
      version: 1,
      inputs: z.object({ a: z.number(), b: z.number() }),
      outputs: z.object({ sum: z.number() }),
      blocks: [{ id: 'adder', block: addBlock }],
      wires: [],
    });
    const events = createEventBus();
    const out = await runWorkflow(
      wf,
      { a: 1, b: 2 },
      { runId: 'r1' as RunId, workspaceId: 'ws', events },
      { resolveBlock: (b) => (typeof b === 'string' ? undefined : b) },
    );
    expect(out).toEqual({ sum: 3 });
  });

  it('chains blocks via wires', async () => {
    const wf = defineWorkflow({
      key: 'wf.chain',
      version: 1,
      inputs: z.object({ a: z.number(), b: z.number() }),
      outputs: z.object({ value: z.number() }),
      blocks: [
        { id: 'adder', block: addBlock },
        { id: 'doubler', block: doubleBlock },
      ],
      wires: [
        { from: { blockId: 'adder', port: 'sum' }, to: { blockId: 'doubler', port: 'value' } },
      ],
    });
    const events = createEventBus();
    const out = await runWorkflow(
      wf,
      { a: 2, b: 3 },
      { runId: 'r2' as RunId, workspaceId: 'ws', events },
      { resolveBlock: (b) => (typeof b === 'string' ? undefined : b) },
    );
    expect(out).toEqual({ value: 10 });
  });

  it('detects cycles', async () => {
    const wf = defineWorkflow({
      key: 'wf.cycle',
      version: 1,
      inputs: z.any(),
      outputs: z.any(),
      blocks: [
        { id: 'a', block: doubleBlock },
        { id: 'b', block: doubleBlock },
      ],
      wires: [
        { from: { blockId: 'a', port: 'value' }, to: { blockId: 'b', port: 'value' } },
        { from: { blockId: 'b', port: 'value' }, to: { blockId: 'a', port: 'value' } },
      ],
    });
    const events = createEventBus();
    await expect(
      runWorkflow(
        wf,
        { value: 1 },
        { runId: 'r3' as RunId, workspaceId: 'ws', events },
        { resolveBlock: (b) => (typeof b === 'string' ? undefined : b) },
      ),
    ).rejects.toBeInstanceOf(WorkflowGraphError);
  });

  it('emits run.started and run.succeeded', async () => {
    const wf = defineWorkflow({
      key: 'wf.events',
      version: 1,
      inputs: z.object({ value: z.number() }),
      outputs: z.object({ value: z.number() }),
      blocks: [{ id: 'd', block: doubleBlock }],
      wires: [],
    });
    const events = createEventBus();
    await runWorkflow(
      wf,
      { value: 4 },
      { runId: 'r4' as RunId, workspaceId: 'ws', events },
      { resolveBlock: (b) => (typeof b === 'string' ? undefined : b) },
    );
    const types = events.history().map((e) => e.type);
    expect(types[0]).toBe('run.started');
    expect(types[types.length - 1]).toBe('run.succeeded');
  });
});
