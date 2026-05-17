import { randomBytes } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

import type { TraceContext } from './types.js';

const traceStore = new AsyncLocalStorage<TraceContext>();

export function generateTraceId(): string {
  return randomBytes(16).toString('hex');
}

export function generateSpanId(): string {
  return randomBytes(8).toString('hex');
}

export function newTraceContext(): TraceContext {
  return { traceId: generateTraceId(), spanId: generateSpanId() };
}

export function childOf(parent: TraceContext): TraceContext {
  return {
    traceId: parent.traceId,
    spanId: generateSpanId(),
    parentSpanId: parent.spanId,
  };
}

export function getCurrentTrace(): TraceContext | undefined {
  return traceStore.getStore();
}

export function runWithTrace<T>(ctx: TraceContext, fn: () => T): T {
  return traceStore.run(ctx, fn);
}

const W3C_TRACEPARENT_VERSION = '00';
const TRACE_FLAGS_SAMPLED = '01';

export function toTraceparent(ctx: TraceContext): string {
  return `${W3C_TRACEPARENT_VERSION}-${ctx.traceId}-${ctx.spanId}-${TRACE_FLAGS_SAMPLED}`;
}

const TRACEPARENT_RE = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;

export function parseTraceparent(header: string): TraceContext | null {
  const m = TRACEPARENT_RE.exec(header.trim());
  if (!m) return null;
  const [, , traceId, spanId] = m;
  if (!traceId || !spanId) return null;
  if (traceId === '0'.repeat(32) || spanId === '0'.repeat(16)) return null;
  return { traceId, spanId };
}

export interface WithSpanOptions {
  parent?: TraceContext;
}

export async function withSpan<T>(
  name: string,
  fn: (ctx: TraceContext) => Promise<T> | T,
  opts: WithSpanOptions = {},
): Promise<T> {
  const parent = opts.parent ?? traceStore.getStore();
  const ctx: TraceContext = parent
    ? childOf(parent)
    : newTraceContext();

  void name;
  return traceStore.run(ctx, async () => {
    return await fn(ctx);
  });
}
