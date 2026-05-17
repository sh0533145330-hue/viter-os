/**
 * Tests for LineageScribe — write + traverse lineage edges.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LineageScribe, LINEAGE_KINDS } from '../lineage.js';
import type { Db, Logger } from '../types.js';

// ---------------------------------------------------------------------------
// Mock DB
// ---------------------------------------------------------------------------

let insertedEdges: Array<Record<string, unknown>> = [];
let storedEdges: Array<Record<string, unknown>> = [];

function createMockDb(): Db {
  return {
    insert: vi.fn().mockImplementation((_table: Record<string, unknown>) => ({
      values: vi.fn().mockImplementation((...rows: unknown[]) => {
        const typedRows = rows.map((r) => r as Record<string, unknown>);
        insertedEdges.push(...typedRows);
        return { returning: vi.fn().mockResolvedValue(rows) };
      }),
    })),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation((cond: unknown) => {
          // Filter stored edges by to_layer and to_id for backward traversal
          if (typeof cond === 'object' && cond !== null) {
            const c = cond as Record<string, unknown>;
            const toLayer = c['to_layer'] as string | undefined;
            const toId = c['to_id'] as string | undefined;
            if (toLayer !== undefined && toId !== undefined) {
              return Promise.resolve(
                storedEdges.filter(
                  (e) => e['to_layer'] === toLayer && e['to_id'] === toId,
                ),
              );
            }
          }
          return Promise.resolve(storedEdges);
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(storedEdges),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
    execute: vi.fn().mockResolvedValue([]),
  };
}

const mockLogger: Logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LineageScribe', () => {
  beforeEach(() => {
    insertedEdges = [];
    storedEdges = [];
    vi.clearAllMocks();
  });

  it('writes a single lineage edge', async () => {
    const db = createMockDb();
    const scribe = new LineageScribe({ db, logger: mockLogger });

    await scribe.writeEdge(
      { layer: 'l0', id: '00000000-0000-0000-0000-000000000001' },
      { layer: 'l1', id: '00000000-0000-0000-0000-000000000002' },
      LINEAGE_KINDS.EXTRACTED_FROM,
    );

    expect(insertedEdges.length).toBeGreaterThan(0);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('wrote 1 lineage edge'),
    );
  });

  it('writes multiple lineage edges in batch', async () => {
    const db = createMockDb();
    const scribe = new LineageScribe({ db, logger: mockLogger });

    await scribe.writeEdges([
      {
        from: { layer: 'l0', id: '00000000-0000-0000-0000-000000000001' },
        to: { layer: 'l1', id: '00000000-0000-0000-0000-000000000002' },
        kind: LINEAGE_KINDS.EXTRACTED_FROM,
      },
      {
        from: { layer: 'l1', id: '00000000-0000-0000-0000-000000000002' },
        to: { layer: 'l2', id: '00000000-0000-0000-0000-000000000003' },
        kind: LINEAGE_KINDS.DERIVED_FROM,
      },
    ]);

    expect(insertedEdges.length).toBeGreaterThan(0);
  });

  it('traverses lineage backward', async () => {
    const db = createMockDb();
    const scribe = new LineageScribe({ db, logger: mockLogger });

    // Set up stored edges for traversal
    storedEdges = [
      {
        from_layer: 'l0',
        from_id: '00000000-0000-0000-0000-000000000001',
        to_layer: 'l1',
        to_id: '00000000-0000-0000-0000-000000000002',
        edge_kind: LINEAGE_KINDS.EXTRACTED_FROM,
      },
      {
        from_layer: 'l1',
        from_id: '00000000-0000-0000-0000-000000000002',
        to_layer: 'l2',
        to_id: '00000000-0000-0000-0000-000000000003',
        edge_kind: LINEAGE_KINDS.DERIVED_FROM,
      },
    ];

    // Traverse backward from L2 entity
    const ancestors = await scribe.traverseBackward('l2', '00000000-0000-0000-0000-000000000003');

    // Should find the L1→L2 edge first, then L0→L1 edge
    expect(ancestors.length).toBe(2);
    expect(ancestors[0]!.layer).toBe('l1');
    expect(ancestors[0]!.kind).toBe(LINEAGE_KINDS.DERIVED_FROM);
    expect(ancestors[1]!.layer).toBe('l0');
    expect(ancestors[1]!.kind).toBe(LINEAGE_KINDS.EXTRACTED_FROM);
  });

  it('handles empty traversal', async () => {
    const db = createMockDb();
    const scribe = new LineageScribe({ db, logger: mockLogger });

    storedEdges = [];
    const ancestors = await scribe.traverseBackward('l2', '00000000-0000-0000-0000-000000000003');
    expect(ancestors.length).toBe(0);
  });

  it('handles writeEdge with attributes', async () => {
    const db = createMockDb();
    const scribe = new LineageScribe({ db, logger: mockLogger });

    await scribe.writeEdge(
      { layer: 'l0', id: '00000000-0000-0000-0000-000000000001' },
      { layer: 'l1', id: '00000000-0000-0000-0000-000000000002' },
      LINEAGE_KINDS.EXTRACTED_FROM,
      { confidence: 0.95, model: 'gpt-4' },
    );

    expect(insertedEdges.length).toBeGreaterThan(0);
  });

  it('does nothing when writing empty batch', async () => {
    const db = createMockDb();
    const scribe = new LineageScribe({ db, logger: mockLogger });

    await scribe.writeEdges([]);
    expect(insertedEdges.length).toBe(0);
  });
});
