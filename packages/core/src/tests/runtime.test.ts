import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineBlock } from '../block.js';
import {
  BlockCancelledError,
  BlockNonRetryableError,
  BlockRetryableError,
  BlockTimeoutError,
  BlockValidationError,
} from '../errors.js';
import { createEventBus } from '../events.js';
import type { BlockId, RunId, StepId, VitaEvent } from '../events.js';
import { MemoryIdempotencyStore, runBlock } from '../runtime.js';

const RUN_ID = 'run-1' as RunId;
const STEP_ID = 'step-1' as StepId;
const BLOCK_ID = 'block-1' as BlockId;

function makeCtx() {
  const events = createEventBus();
  const captured: VitaEvent[] = [];
  events.onAny((e) => captured.push(e));
  return {
    events,
    captured,
    runId: RUN_ID,
    stepId: STEP_ID,
    blockId: BLOCK_ID,
    workspaceId: 'ws-1',
  };
}

describe('runBlock', () => {
  it('validates input and emits start/succeed events', async () => {
    const block = defineBlock<{ n: number }, { n: number }>({
      key: 'utility.double',
      category: 'utility',
      inputs: z.object({ n: z.number() }),
      outputs: z.object({ n: z.number() }),
      idempotent: false,
      handler: async (input) => ({ n: input.n * 2 }),
    });

    const ctx = makeCtx();
    const result = await runBlock(
      block,
      { n: 3 },
      {
        ...ctx,
        sleep: () => Promise.resolve(),
      },
    );

    expect(result).toEqual({ n: 6 });
    expect(ctx.captured.map((e) => e.type)).toEqual(['block.started', 'block.succeeded']);
  });

  it('rejects malformed input with BlockValidationError', async () => {
    const block = defineBlock({
      key: 'utility.strict',
      category: 'utility',
      inputs: z.object({ n: z.number() }),
      outputs: z.any(),
      idempotent: false,
      handler: async () => ({}),
    });
    const ctx = makeCtx();
    await expect(
      runBlock(block, { n: 'oops' }, { ...ctx, sleep: () => Promise.resolve() }),
    ).rejects.toBeInstanceOf(BlockValidationError);
    expect(ctx.captured[0]?.type).toBe('block.failed');
  });

  it('retries retryable errors up to max attempts', async () => {
    let calls = 0;
    const block = defineBlock({
      key: 'utility.retry',
      category: 'utility',
      inputs: z.any(),
      outputs: z.object({ n: z.number() }),
      idempotent: false,
      retries: { max: 2, backoffMs: 1 },
      handler: async () => {
        calls += 1;
        if (calls < 3) throw new BlockRetryableError('flaky');
        return { n: calls };
      },
    });
    const ctx = makeCtx();
    const result = await runBlock(
      block,
      {},
      {
        ...ctx,
        sleep: () => Promise.resolve(),
      },
    );
    expect(result).toEqual({ n: 3 });
    const retryEvents = ctx.captured.filter((e) => e.type === 'block.retried');
    expect(retryEvents).toHaveLength(2);
  });

  it('does not retry non-retryable errors', async () => {
    let calls = 0;
    const block = defineBlock({
      key: 'utility.nonretry',
      category: 'utility',
      inputs: z.any(),
      outputs: z.any(),
      idempotent: false,
      retries: { max: 3, backoffMs: 0 },
      handler: async () => {
        calls += 1;
        throw new BlockNonRetryableError('nope');
      },
    });
    const ctx = makeCtx();
    await expect(
      runBlock(block, {}, { ...ctx, sleep: () => Promise.resolve() }),
    ).rejects.toBeInstanceOf(BlockNonRetryableError);
    expect(calls).toBe(1);
  });

  it('returns cached output when idempotent + key supplied', async () => {
    const store = new MemoryIdempotencyStore();
    const handler = vi.fn(async () => ({ n: 1 }));
    const block = defineBlock({
      key: 'utility.idem',
      category: 'utility',
      inputs: z.any(),
      outputs: z.object({ n: z.number() }),
      idempotent: true,
      handler,
    });
    const ctx = makeCtx();
    const a = await runBlock(
      block,
      {},
      {
        ...ctx,
        idempotency: store,
        idempotencyKey: 'k1',
        sleep: () => Promise.resolve(),
      },
    );
    const b = await runBlock(
      block,
      {},
      {
        ...ctx,
        idempotency: store,
        idempotencyKey: 'k1',
        sleep: () => Promise.resolve(),
      },
    );
    expect(a).toEqual({ n: 1 });
    expect(b).toEqual({ n: 1 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('times out when handler exceeds timeoutMs', async () => {
    const block = defineBlock({
      key: 'utility.slow',
      category: 'utility',
      inputs: z.any(),
      outputs: z.any(),
      idempotent: false,
      timeoutMs: 5,
      handler: async () => new Promise((resolve) => setTimeout(resolve, 100)),
    });
    const ctx = makeCtx();
    await expect(
      runBlock(block, {}, { ...ctx, sleep: () => Promise.resolve() }),
    ).rejects.toBeInstanceOf(BlockTimeoutError);
  });

  it('propagates external abort signal as cancellation', async () => {
    const block = defineBlock({
      key: 'utility.cancel',
      category: 'utility',
      inputs: z.any(),
      outputs: z.any(),
      idempotent: false,
      handler: async (_input, blockCtx) =>
        new Promise((_, reject) => {
          blockCtx.abort.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    });
    const ctx = makeCtx();
    const controller = new AbortController();
    const promise = runBlock(
      block,
      {},
      {
        ...ctx,
        signal: controller.signal,
        sleep: () => Promise.resolve(),
      },
    );
    queueMicrotask(() => controller.abort());
    await expect(promise).rejects.toBeInstanceOf(BlockCancelledError);
  });

  it('validates output shape', async () => {
    const block = defineBlock({
      key: 'utility.bad-output',
      category: 'utility',
      inputs: z.any(),
      outputs: z.object({ n: z.number() }),
      idempotent: false,
      handler: async () => ({ n: 'not-a-number' }) as unknown as { n: number },
    });
    const ctx = makeCtx();
    await expect(
      runBlock(block, {}, { ...ctx, sleep: () => Promise.resolve() }),
    ).rejects.toBeInstanceOf(BlockValidationError);
  });
});
