/**
 * Tests for VectorSearch.
 */

import { describe, expect, it, vi } from 'vitest';
import type { Db, Logger } from '../types.js';
import { VectorSearch } from '../vector-search.js';

const logger: Logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

function mockDb(rows: unknown[]): { db: Db; execute: ReturnType<typeof vi.fn> } {
  const execute = vi.fn().mockResolvedValue(rows);
  const db = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute,
  } as unknown as Db;
  return { db, execute };
}

describe('VectorSearch', () => {
  it('queries l1_artifacts with the workspace id and vector literal', async () => {
    const { db, execute } = mockDb([{ id: 'doc-1', body: 'body', distance: 0.1 }]);
    const v = new VectorSearch({ db, logger });
    const hits = await v.searchL1('ws-1', [0.1, 0.2, 0.3], 5);
    expect(hits.length).toBe(1);
    expect(hits[0]?.id).toBe('doc-1');
    expect(hits[0]?.layer).toBe('l1');
    expect(hits[0]?.score).toBeGreaterThan(0);
    const arg = execute.mock.calls[0]?.[0] as { text: string; values: unknown[] };
    expect(arg.text).toMatch(/l1_artifacts/);
    expect(arg.text).toMatch(/workspace_id = \$2/);
    expect(arg.values).toEqual(['[0.1,0.2,0.3]', 'ws-1', 5]);
  });

  it('converts cosine distance to a normalised score', async () => {
    const { db } = mockDb([
      { id: 'a', body: '', distance: 0 }, // perfectly aligned → score = 1
      { id: 'b', body: '', distance: 2 }, // opposite → score = 0
    ]);
    const v = new VectorSearch({ db, logger });
    const hits = await v.searchL1('ws-1', [0.1]);
    expect(hits[0]?.score).toBeCloseTo(1, 6);
    expect(hits[1]?.score).toBeCloseTo(0, 6);
  });

  it('searchEntities returns name and optional kind', async () => {
    const { db } = mockDb([
      { id: 'e1', name: 'Acme', kind: 'org', distance: 0.2 },
      { id: 'e2', name: 'Beta', distance: 0.5 },
    ]);
    const v = new VectorSearch({ db, logger });
    const hits = await v.searchEntities('ws-1', [0.1]);
    expect(hits[0]?.id).toBe('e1');
    expect(hits[0]?.name).toBe('Acme');
    expect(hits[0]?.kind).toBe('org');
    expect(hits[1]?.kind).toBeUndefined();
  });

  it('rejects empty query vectors', async () => {
    const { db } = mockDb([]);
    const v = new VectorSearch({ db, logger });
    await expect(v.searchL1('ws-1', [])).rejects.toThrow(/must not be empty/);
  });

  it('propagates db errors with a log', async () => {
    const error = vi.fn();
    const db = {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      execute: vi.fn().mockRejectedValue(new Error('pg down')),
    } as unknown as Db;
    const v = new VectorSearch({ db, logger: { ...logger, error } });
    await expect(v.searchL1('ws-1', [0.1])).rejects.toThrow(/pg down/);
    expect(error).toHaveBeenCalled();
  });

  it('searchLayer routes to the right table', async () => {
    const { db, execute } = mockDb([]);
    const v = new VectorSearch({ db, logger });
    await v.searchLayer('l2', 'ws-1', [0.1]);
    const arg = execute.mock.calls[0]?.[0] as { text: string };
    expect(arg.text).toMatch(/l2_artifacts/);
  });
});
