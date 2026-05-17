import { type BlockId, type RunId, type StepId, createEventBus, runBlock } from '@vita/core';
import { describe, expect, it } from 'vitest';
import {
  foreachBlock,
  formatBlock,
  logBlock,
  parallelBlock,
  sleepBlock,
  transformBlock,
} from '../utility/index.js';

const baseOptions = {
  runId: 'run' as RunId,
  stepId: 'step' as StepId,
  blockId: 'block' as BlockId,
  workspaceId: 'ws',
};

describe('utility.transform', () => {
  it('applies a JSONata expression to data', async () => {
    const events = createEventBus();
    const out = await runBlock(
      transformBlock,
      { expression: '$.value * 2', data: { value: 7 } },
      { ...baseOptions, events },
    );
    expect(out).toEqual({ result: 14 });
  });

  it('fails when expression cannot be parsed', async () => {
    const events = createEventBus();
    await expect(
      runBlock(transformBlock, { expression: '$.[[[bad', data: {} }, { ...baseOptions, events }),
    ).rejects.toThrow();
  });
});

describe('utility.format', () => {
  it('substitutes mustache placeholders', async () => {
    const events = createEventBus();
    const out = await runBlock(
      formatBlock,
      { template: 'Hello {{name}}!', vars: { name: 'Vita' } },
      { ...baseOptions, events },
    );
    expect(out.text).toBe('Hello Vita!');
  });

  it('html-escapes when escape=html', async () => {
    const events = createEventBus();
    const out = await runBlock(
      formatBlock,
      { template: '{{html}}', vars: { html: '<b>x</b>' }, escape: 'html' },
      { ...baseOptions, events },
    );
    expect(out.text).toBe('&lt;b&gt;x&lt;/b&gt;');
  });

  it('resolves dotted paths', async () => {
    const events = createEventBus();
    const out = await runBlock(
      formatBlock,
      { template: '{{ user.name }}', vars: { user: { name: 'Jo' } } },
      { ...baseOptions, events },
    );
    expect(out.text).toBe('Jo');
  });
});

describe('utility.log', () => {
  it('passes payload through and invokes logger', async () => {
    const events = createEventBus();
    const logs: string[] = [];
    const out = await runBlock(
      logBlock,
      { level: 'warn', message: 'hi', payload: { x: 1 } },
      {
        ...baseOptions,
        events,
        logger: {
          info: () => undefined,
          warn: (msg) => logs.push(`warn:${msg}`),
          error: () => undefined,
        },
      },
    );
    expect(out).toMatchObject({ level: 'warn', message: 'hi', payload: { x: 1 } });
    expect(logs).toContain('warn:hi');
  });
});

describe('utility.sleep', () => {
  it('returns immediately when ms=0', async () => {
    const events = createEventBus();
    const out = await runBlock(sleepBlock, { ms: 0 }, { ...baseOptions, events });
    expect(out.sleptMs).toBe(0);
  });

  it('honours short ms', async () => {
    const events = createEventBus();
    const out = await runBlock(sleepBlock, { ms: 10 }, { ...baseOptions, events });
    expect(out.sleptMs).toBeGreaterThanOrEqual(5);
  });
});

describe('utility.parallel', () => {
  it('runs branches via injected runner and aggregates', async () => {
    const events = createEventBus();
    const out = await runBlock(
      parallelBlock,
      {
        branches: [
          { key: 'a', run: 1 },
          { key: 'b', run: 2 },
        ],
        failFast: false,
      },
      {
        ...baseOptions,
        events,
        extraContext: {
          runBranch: async (_k: string, payload: unknown) => (payload as number) * 10,
        },
      },
    );
    expect(out.results).toEqual({ a: 10, b: 20 });
    expect(out.errors).toEqual({});
  });

  it('collects errors per branch', async () => {
    const events = createEventBus();
    const out = await runBlock(
      parallelBlock,
      {
        branches: [
          { key: 'ok', run: 1 },
          { key: 'fail', run: 2 },
        ],
        failFast: false,
      },
      {
        ...baseOptions,
        events,
        extraContext: {
          runBranch: async (k: string) => {
            if (k === 'fail') throw new Error('boom');
            return 'ok';
          },
        },
      },
    );
    expect(out.results.ok).toBe('ok');
    expect(out.errors.fail?.message).toBe('boom');
  });
});

describe('utility.foreach', () => {
  it('processes items with bounded concurrency', async () => {
    const events = createEventBus();
    const out = await runBlock(
      foreachBlock,
      { items: [1, 2, 3, 4], maxConcurrency: 2 },
      {
        ...baseOptions,
        events,
        extraContext: { runItem: async (item: unknown) => (item as number) + 100 },
      },
    );
    expect(out.results).toEqual([101, 102, 103, 104]);
    expect(out.errors).toEqual([]);
  });

  it('collects errors by index', async () => {
    const events = createEventBus();
    const out = await runBlock(
      foreachBlock,
      { items: [1, 2, 3], maxConcurrency: 3 },
      {
        ...baseOptions,
        events,
        extraContext: {
          runItem: async (item: unknown, index: number) => {
            if (index === 1) throw new Error('skip');
            return item;
          },
        },
      },
    );
    expect(out.errors).toHaveLength(1);
    expect(out.errors[0]).toMatchObject({ index: 1, message: 'skip' });
  });
});
