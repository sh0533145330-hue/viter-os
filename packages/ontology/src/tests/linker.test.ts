/**
 * Tests for EntityLinker — exact/fuzzy/LLM resolution.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityLinker } from '../linker.js';
import type { Db, Logger, EntityRef, LinkResult, ModelProvider } from '../types.js';

// ---------------------------------------------------------------------------
// Mock DB with name-aware filtering
// ---------------------------------------------------------------------------

/**
 * Creates a mock DB that properly filters entities by the
 * conditions passed to `where`. Supports `name`, `workspace_id`,
 * and `to_layer`/`to_id` filters.
 */
function createFilteringMockDb(allEntities: Array<Record<string, unknown>> = []): Db {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue(allEntities) }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation((cond: unknown) => {
          if (typeof cond !== 'object' || cond === null) return Promise.resolve(allEntities);
          const c = cond as Record<string, unknown>;

          // If this is an exact match query (has 'and' array or direct name match)
          if (c['and'] !== undefined && Array.isArray(c['and'])) {
            const andConditions = c['and'] as Array<Record<string, unknown>>;
            return Promise.resolve(
              allEntities.filter((row) =>
                andConditions.every((condItem) => {
                  for (const [key, value] of Object.entries(condItem)) {
                    if (key === 'name') {
                      // Normalise names for comparison (like the linker does)
                      const rowName = String(row['name'] ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
                      const condName = String(value).toLowerCase().trim().replace(/\s+/g, ' ');
                      if (rowName !== condName) return false;
                    } else if (row[key] !== value) {
                      return false;
                    }
                  }
                  return true;
                }),
              ),
            );
          }

          // Simple key=value conditions
          const filtered = allEntities.filter((row) => {
            for (const [key, value] of Object.entries(c)) {
              if (key === 'to_layer' || key === 'to_id') {
                if (row[key] !== value) return false;
              } else if (key === 'workspace_id' || key === 'name') {
                if (row[key] !== value) return false;
              }
            }
            return true;
          });
          return Promise.resolve(filtered);
        }),
        orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(allEntities) }),
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
// Exact match tests
// ---------------------------------------------------------------------------

describe('EntityLinker — exact match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds an exact match by name', async () => {
    const entities = [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Alice Smith', workspace_id: 'ws-1' },
    ];
    const db = createFilteringMockDb(entities);
    const linker = new EntityLinker({ db, logger: mockLogger });

    const refs: EntityRef[] = [{ kind: 'person', name: 'Alice Smith' }];
    const results = await linker.link(refs, 'ws-1');

    expect(results.length).toBe(1);
    expect(results[0]!.method).toBe('exact');
    expect(results[0]!.confidence).toBe(1.0);
    expect(results[0]!.entityId).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('returns empty entityId when no exact match found', async () => {
    const entities = [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Bob Jones', workspace_id: 'ws-1' },
    ];
    const db = createFilteringMockDb(entities);
    const linker = new EntityLinker({ db, logger: mockLogger });

    const refs: EntityRef[] = [{ kind: 'person', name: 'Unknown Person' }];
    const results = await linker.link(refs, 'ws-1');

    expect(results.length).toBe(1);
    expect(results[0]!.entityId).toBe('');
    expect(results[0]!.confidence).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Fuzzy match tests
// ---------------------------------------------------------------------------

describe('EntityLinker — fuzzy match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds a fuzzy match when exact match fails', async () => {
    const entities = [
      { id: '22222222-2222-2222-2222-222222222222', name: 'Alice Smith', workspace_id: 'ws-1' },
    ];
    const db = createFilteringMockDb(entities);
    const linker = new EntityLinker({ db, logger: mockLogger });

    // "Alice Smit" is close to "Alice Smith" but not exact
    const refs: EntityRef[] = [{ kind: 'person', name: 'Alice Smit' }];
    const results = await linker.link(refs, 'ws-1');

    expect(results.length).toBe(1);
    expect(results[0]!.method).toBe('fuzzy');
    expect(results[0]!.confidence).toBeGreaterThan(0);
    expect(results[0]!.confidence).toBeLessThan(1);
    expect(results[0]!.entityId).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('does not match below fuzzy threshold', async () => {
    const entities = [
      { id: '33333333-3333-3333-3333-333333333333', name: 'Completely Different', workspace_id: 'ws-1' },
    ];
    const db = createFilteringMockDb(entities);
    const linker = new EntityLinker({ db, logger: mockLogger });

    const refs: EntityRef[] = [{ kind: 'person', name: 'Alice Smith' }];
    const results = await linker.link(refs, 'ws-1');

    // The names are very different; should not fuzzy match
    expect(results[0]!.entityId).toBe('');
  });
});

// ---------------------------------------------------------------------------
// LLM match tests
// ---------------------------------------------------------------------------

describe('EntityLinker — LLM match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses LLM provider for disambiguation when available', async () => {
    const entities = [
      { id: '44444444-4444-4444-4444-444444444444', name: 'Alice Smith', workspace_id: 'ws-1' },
      { id: '55555555-5555-5555-5555-555555555555', name: 'Alice Johnson', workspace_id: 'ws-1' },
    ];

    const mockProvider: ModelProvider = {
      name: 'mock',
      send: vi.fn().mockResolvedValue({
        text: '1',
        tokensIn: 100,
        tokensOut: 1,
        costCents: 0,
        model: 'mock',
        finishReason: 'stop',
      }),
    };

    // Use a name that doesn't fuzzy-match well to any entity,
    // forcing the linker to fall through to LLM disambiguation.
    // "A. Smith" has low trigram similarity to "Alice Smith" and "Alice Johnson"
    const db = createFilteringMockDb(entities);

    // Override fuzzy to fail by controlling which entities are returned:
    // exact match: no results (name doesn't match)
    // fuzzy candidates: return both candidates
    let selectCallCount = 0;
    const customSelectFn = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation((cond: unknown) => {
          selectCallCount++;
          // First call: exact match (filtered by name) — should return empty
          if (selectCallCount === 1) return Promise.resolve([]);
          // Second call: fuzzy candidates — return all workspace entities
          return Promise.resolve(entities);
        }),
        orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(entities) }),
      }),
    });

    const customDb: Db = {
      ...createFilteringMockDb(entities),
      select: customSelectFn,
    };

    const linker = new EntityLinker({ db: customDb, modelProvider: mockProvider, logger: mockLogger });

    const refs: EntityRef[] = [{ kind: 'person', name: 'A. Smith' }];
    const results = await linker.link(refs, 'ws-1');

    // With LLM, should resolve to one of the candidates
    expect(results[0]!.method).toBe('llm');
    expect(results[0]!.entityId).toBeTruthy();
  });

  it('skips LLM when no provider is injected', async () => {
    const db = createFilteringMockDb([]);
    const linker = new EntityLinker({ db, logger: mockLogger });

    const refs: EntityRef[] = [{ kind: 'person', name: 'Nobody' }];
    const results = await linker.link(refs, 'ws-1');

    expect(results[0]!.entityId).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Batch linking
// ---------------------------------------------------------------------------

describe('EntityLinker — batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves multiple refs in one call', async () => {
    const entities = [
      { id: '66666666-6666-6666-6666-666666666666', name: 'alice', workspace_id: 'ws-1' },
    ];
    const db = createFilteringMockDb(entities);
    const linker = new EntityLinker({ db, logger: mockLogger });

    const refs: EntityRef[] = [
      { kind: 'person', name: 'alice' },
      { kind: 'org', name: 'Unknown Org' },
    ];

    const results = await linker.link(refs, 'ws-1');
    expect(results.length).toBe(2);
    // alice should be exact matched
    expect(results[0]!.method).toBe('exact');
    // Unknown Org should not be found
    expect(results[1]!.entityId).toBe('');
  });
});
