import { describe, expect, it } from 'vitest';
import {
  generateTraceId,
  generateSpanId,
  newTraceContext,
  childOf,
  getCurrentTrace,
  runWithTrace,
  toTraceparent,
  parseTraceparent,
  withSpan,
} from './trace.js';

describe('generateTraceId', () => {
  it('produces a 32-char hex string', () => {
    const id = generateTraceId();
    expect(id).toHaveLength(32);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('produces unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateTraceId()));
    expect(ids.size).toBe(50);
  });
});

describe('generateSpanId', () => {
  it('produces a 16-char hex string', () => {
    const id = generateSpanId();
    expect(id).toHaveLength(16);
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('newTraceContext', () => {
  it('creates a context with traceId and spanId', () => {
    const ctx = newTraceContext();
    expect(ctx.traceId).toHaveLength(32);
    expect(ctx.spanId).toHaveLength(16);
    expect(ctx.parentSpanId).toBeUndefined();
  });
});

describe('childOf', () => {
  it('inherits traceId and sets parentSpanId', () => {
    const parent = newTraceContext();
    const child = childOf(parent);
    expect(child.traceId).toBe(parent.traceId);
    expect(child.parentSpanId).toBe(parent.spanId);
    expect(child.spanId).not.toBe(parent.spanId);
  });
});

describe('AsyncLocalStorage propagation', () => {
  it('runWithTrace sets and retrieves context', () => {
    const ctx = newTraceContext();
    runWithTrace(ctx, () => {
      expect(getCurrentTrace()).toEqual(ctx);
    });
  });

  it('getCurrentTrace returns undefined outside a trace', () => {
    expect(getCurrentTrace()).toBeUndefined();
  });

  it('nested spans propagate correctly', () => {
    const outer = newTraceContext();
    runWithTrace(outer, () => {
      const current = getCurrentTrace();
      expect(current?.traceId).toBe(outer.traceId);

      const child = childOf(outer);
      runWithTrace(child, () => {
        const inner = getCurrentTrace();
        expect(inner?.traceId).toBe(outer.traceId);
        expect(inner?.parentSpanId).toBe(outer.spanId);
      });

      expect(getCurrentTrace()?.spanId).toBe(outer.spanId);
    });
  });
});

describe('W3C traceparent', () => {
  it('toTraceparent produces valid header', () => {
    const ctx = newTraceContext();
    const header = toTraceparent(ctx);
    expect(header).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it('parseTraceparent round-trips', () => {
    const ctx = newTraceContext();
    const header = toTraceparent(ctx);
    const parsed = parseTraceparent(header);
    expect(parsed).not.toBeNull();
    expect(parsed!.traceId).toBe(ctx.traceId);
    expect(parsed!.spanId).toBe(ctx.spanId);
  });

  it('parseTraceparent returns null for invalid input', () => {
    expect(parseTraceparent('invalid')).toBeNull();
    expect(parseTraceparent('00-00000000000000000000000000000000-0000000000000000-01')).toBeNull();
  });
});

describe('withSpan', () => {
  it('creates a new trace context if no parent', async () => {
    const result = await withSpan('test-span', async (ctx) => {
      expect(ctx.traceId).toHaveLength(32);
      expect(ctx.spanId).toHaveLength(16);
      return 'done';
    });
    expect(result).toBe('done');
  });

  it('creates child context when parent provided', async () => {
    const parent = newTraceContext();
    const result = await withSpan('child-span', async (ctx) => {
      expect(ctx.traceId).toBe(parent.traceId);
      expect(ctx.parentSpanId).toBe(parent.spanId);
      return 'child-done';
    }, { parent });
    expect(result).toBe('child-done');
  });

  it('propagates context within withSpan', async () => {
    await withSpan('outer', async (ctx) => {
      const current = getCurrentTrace();
      expect(current?.traceId).toBe(ctx.traceId);
    });
  });
});
