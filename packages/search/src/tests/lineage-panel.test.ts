/**
 * Tests for LineagePanel — traces citations back through lineage_edges.
 */

import { describe, expect, it, vi } from 'vitest';
import { LineagePanel } from '../lineage-panel.js';
import type { AnswerResponse, Db, Logger } from '../types.js';

const logger: Logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

interface Edge {
  from_layer: string;
  from_id: string;
  to_layer: string;
  to_id: string;
  kind: string;
}

function dbWithEdges(edges: Edge[]): Db {
  const select = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockImplementation((cond: Record<string, unknown>) => {
        const filtered = edges.filter(
          (e) => e.to_layer === cond.to_layer && e.to_id === cond.to_id,
        );
        return Promise.resolve(filtered);
      }),
      orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
    }),
  });
  return {
    insert: vi.fn(),
    select,
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn().mockResolvedValue([]),
  } as unknown as Db;
}

function answer(citations: AnswerResponse['citations']): AnswerResponse {
  return {
    answer: 'a',
    citations,
    confidence: 0.9,
    tokens: { in: 0, out: 0 },
    costCents: 0,
    latencyMs: 1,
    sources: [],
  };
}

describe('LineagePanel.buildTrace', () => {
  it('walks one level back from each citation', async () => {
    const db = dbWithEdges([
      { from_layer: 'l0', from_id: 'raw-1', to_layer: 'l1', to_id: 'l1-1', kind: 'extracted_from' },
    ]);
    const panel = new LineagePanel({ db, logger });
    const trace = await panel.buildTrace(
      answer([{ sourceId: 'l1-1', sourceLayer: 'l1', relevance: 0.9, quote: 'hello' }]),
      'why?',
      'ans-1',
    );

    expect(trace.answerId).toBe('ans-1');
    expect(trace.query).toBe('why?');
    expect(trace.sources.length).toBe(1);
    expect(trace.sources[0]?.lineageBackward).toEqual([
      { layer: 'l0', id: 'raw-1', kind: 'extracted_from' },
    ]);
  });

  it('walks multiple levels and respects maxDepth', async () => {
    const db = dbWithEdges([
      { from_layer: 'l1', from_id: 'l1-1', to_layer: 'l2', to_id: 'l2-1', kind: 'derived_from' },
      { from_layer: 'l0', from_id: 'raw-1', to_layer: 'l1', to_id: 'l1-1', kind: 'extracted_from' },
    ]);
    const panel = new LineagePanel({ db, logger });
    const trace = await panel.buildTrace(
      answer([{ sourceId: 'l2-1', sourceLayer: 'l2', relevance: 0.9 }]),
      'why?',
    );
    const ids = trace.sources[0]?.lineageBackward.map((e) => `${e.layer}:${e.id}`);
    expect(ids).toContain('l1:l1-1');
    expect(ids).toContain('l0:raw-1');
  });

  it('returns an empty lineage when the db errors out and logs a warning', async () => {
    const db: Db = {
      insert: vi.fn(),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('db down')),
          orderBy: vi.fn(),
        }),
      }),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn(),
    } as unknown as Db;
    const warn = vi.fn();
    const panel = new LineagePanel({ db, logger: { ...logger, warn } });
    const trace = await panel.buildTrace(
      answer([{ sourceId: 'x', sourceLayer: 'l1', relevance: 0.5 }]),
      'q',
    );
    expect(trace.sources[0]?.lineageBackward).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('adds a low-confidence reasoning string when confidence < 0.5', async () => {
    const db = dbWithEdges([]);
    const panel = new LineagePanel({ db, logger });
    const trace = await panel.buildTrace(
      {
        answer: 'I am unsure.',
        citations: [],
        confidence: 0.3,
        tokens: { in: 0, out: 0 },
        costCents: 0,
        latencyMs: 1,
        sources: [],
      },
      'q?',
    );
    expect(trace.reasoning).toMatch(/Low confidence/);
  });

  it('returns no sources when there are no citations', async () => {
    const db = dbWithEdges([]);
    const panel = new LineagePanel({ db, logger });
    const trace = await panel.buildTrace(answer([]), 'q', 'ans-2');
    expect(trace.sources).toEqual([]);
  });

  it('does not revisit nodes (cycle safety)', async () => {
    // Cycle: l1-a → l1-b → l1-a
    const where = vi.fn().mockImplementation((cond: Record<string, unknown>) => {
      if (cond.to_id === 'l1-a') {
        return Promise.resolve([
          { from_layer: 'l1', from_id: 'l1-b', to_layer: 'l1', to_id: 'l1-a', kind: 'rel' },
        ]);
      }
      if (cond.to_id === 'l1-b') {
        return Promise.resolve([
          { from_layer: 'l1', from_id: 'l1-a', to_layer: 'l1', to_id: 'l1-b', kind: 'rel' },
        ]);
      }
      return Promise.resolve([]);
    });
    const db: Db = {
      insert: vi.fn(),
      select: vi
        .fn()
        .mockReturnValue({ from: vi.fn().mockReturnValue({ where, orderBy: vi.fn() }) }),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn(),
    } as unknown as Db;
    const panel = new LineagePanel({ db, logger, maxDepth: 10 });
    const trace = await panel.buildTrace(
      answer([{ sourceId: 'l1-a', sourceLayer: 'l1', relevance: 1 }]),
      'q',
    );
    // Should terminate even with cycle
    expect(trace.sources[0]?.lineageBackward.length).toBeLessThan(10);
  });
});
