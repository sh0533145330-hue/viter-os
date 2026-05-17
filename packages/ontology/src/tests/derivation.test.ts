/**
 * Tests for DerivationRunner — re-processing state machine.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DerivationRunner } from '../derivation.js';
import { ExtractionFramework } from '../extractor.js';
import { GenericExtractor } from '../extractors/generic.js';
import type { Db, Logger, DerivationKind, DerivationScope, DerivationStatus } from '../types.js';

// ---------------------------------------------------------------------------
// Mock DB with controllable derivation run storage
// ---------------------------------------------------------------------------

let derivationRuns: Array<Record<string, unknown>> = [];
let nextId = 1;

function createMockDb(): Db {
  return {
    insert: vi.fn().mockImplementation((_table: Record<string, unknown>) => ({
      values: vi.fn().mockImplementation((row: unknown) => {
        const r = row as Record<string, unknown>;
        const id = `derivation-${nextId++}`;
        const run = { ...r, id };
        derivationRuns.push(run);
        return { returning: vi.fn().mockResolvedValue([run]) };
      }),
    })),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation((cond: unknown) => {
          if (typeof cond !== 'object' || cond === null) return Promise.resolve([]);
          const c = cond as Record<string, unknown>;
          return Promise.resolve(
            derivationRuns.filter((row) => {
              if (c['id'] !== undefined && row['id'] !== c['id']) return false;
              return true;
            }),
          );
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(derivationRuns),
        }),
      }),
    }),
    update: vi.fn().mockImplementation((_table: Record<string, unknown>) => ({
      set: vi.fn().mockImplementation((values: Record<string, unknown>) => ({
        where: vi.fn().mockImplementation((cond: unknown) => {
          if (typeof cond !== 'object' || cond === null) return Promise.resolve([]);
          const c = cond as Record<string, unknown>;
          for (const run of derivationRuns) {
            if (run['id'] === c['id']) {
              Object.assign(run, values);
            }
          }
          return Promise.resolve([]);
        }),
        returning: vi.fn().mockResolvedValue([]),
      })),
    })),
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

describe('DerivationRunner', () => {
  beforeEach(() => {
    derivationRuns = [];
    nextId = 1;
    vi.clearAllMocks();
  });

  it('enqueues a derivation run', async () => {
    const db = createMockDb();
    const framework = new ExtractionFramework(mockLogger);
    framework.register(new GenericExtractor());
    const runner = new DerivationRunner({ db, extractionFramework: framework, logger: mockLogger });

    const scope: DerivationScope = {
      workspaceId: '00000000-0000-0000-0000-000000000001',
    };

    const id = await runner.enqueue('reextract', scope);

    expect(id).toBeTruthy();
    expect(derivationRuns.length).toBe(1);
    expect(derivationRuns[0]!['status']).toBe('queued');
    expect(derivationRuns[0]!['run_kind']).toBe('reextract');
  });

  it('transitions a run from queued → running → succeeded', async () => {
    const db = createMockDb();
    const framework = new ExtractionFramework(mockLogger);
    framework.register(new GenericExtractor());
    const runner = new DerivationRunner({ db, extractionFramework: framework, logger: mockLogger });

    const scope: DerivationScope = {
      workspaceId: '00000000-0000-0000-0000-000000000001',
    };

    const id = await runner.enqueue('relink', scope);
    expect(await runner.getStatus(id)).toBe('queued');

    await runner.run(id);
    expect(await runner.getStatus(id)).toBe('succeeded');
  });

  it('transitions to failed when extraction framework throws', async () => {
    // Build a mock DB that returns L0 artifacts for the reextract query
    // and supports the derivation run state machine
    const scope: DerivationScope = {
      workspaceId: '00000000-0000-0000-0000-000000000001',
      ids: ['00000000-0000-0000-0000-000000000099'],
    };

    let currentDerivationRun: Record<string, unknown> | null = null;

    const db: Db = {
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((row: unknown) => {
          const r = row as Record<string, unknown>;
          const id = `derivation-${nextId++}`;
          currentDerivationRun = { ...r, id };
          return { returning: vi.fn().mockResolvedValue([currentDerivationRun]) };
        }),
      })),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation((table: unknown) => ({
          where: vi.fn().mockImplementation((cond: unknown) => {
            const tableName = typeof table === 'string' ? table : '';
            if (tableName === 'l0_artifacts') {
              // Return L0 artifacts that will trigger the failing extractor
              return Promise.resolve([
                { id: '00000000-0000-0000-0000-000000000099', source_kind: 'failing', mime_type: 'text/plain', workspace_id: scope.workspaceId },
              ]);
            }
            // Derivation runs
            if (currentDerivationRun && typeof cond === 'object' && cond !== null) {
              const c = cond as Record<string, unknown>;
              if (c['id'] !== undefined && currentDerivationRun['id'] === c['id']) {
                return Promise.resolve([currentDerivationRun]);
              }
            }
            return Promise.resolve(currentDerivationRun ? [currentDerivationRun] : []);
          }),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(currentDerivationRun ? [currentDerivationRun] : []),
          }),
        })),
      }),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation((values: Record<string, unknown>) => ({
          where: vi.fn().mockImplementation((cond: unknown) => {
            if (currentDerivationRun && typeof cond === 'object' && cond !== null) {
              const c = cond as Record<string, unknown>;
              if (c['id'] === currentDerivationRun['id']) {
                Object.assign(currentDerivationRun, values);
              }
            }
            return Promise.resolve([]);
          }),
          returning: vi.fn().mockResolvedValue([]),
        })),
      })),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
      execute: vi.fn().mockResolvedValue([]),
    };

    // Framework with a failing extractor
    const framework = new ExtractionFramework(mockLogger);
    const failingExtractor: import('../extractor.js').Extractor = {
      kind: 'failing',
      extract: async () => { throw new Error('Extraction failed'); },
    };
    framework.register(failingExtractor);

    const runner = new DerivationRunner({ db, extractionFramework: framework, logger: mockLogger });

    const id = await runner.enqueue('reextract', scope);

    // Run should fail because the extractor throws
    try {
      await runner.run(id);
    } catch {
      // Expected to throw after marking as failed
    }

    const status = await runner.getStatus(id);
    expect(status).toBe('failed');
  });

  it('rejects running a non-queued derivation', async () => {
    const db = createMockDb();
    const framework = new ExtractionFramework(mockLogger);
    framework.register(new GenericExtractor());
    const runner = new DerivationRunner({ db, extractionFramework: framework, logger: mockLogger });

    const scope: DerivationScope = {
      workspaceId: '00000000-0000-0000-0000-000000000001',
    };

    const id = await runner.enqueue('relink', scope);
    await runner.run(id);

    // Trying to run again should fail
    await expect(runner.run(id)).rejects.toThrow('not in');
  });

  it('supports all derivation kinds', async () => {
    const db = createMockDb();
    const framework = new ExtractionFramework(mockLogger);
    framework.register(new GenericExtractor());
    const runner = new DerivationRunner({ db, extractionFramework: framework, logger: mockLogger });

    const kinds: DerivationKind[] = ['reextract', 'relink', 'rederive', 'rematerialize'];
    const scope: DerivationScope = {
      workspaceId: '00000000-0000-0000-0000-000000000001',
    };

    for (const kind of kinds) {
      const id = await runner.enqueue(kind, scope);
      await runner.run(id);
      expect(await runner.getStatus(id)).toBe('succeeded');
    }
  });

  it('stores scope in derivation run', async () => {
    const db = createMockDb();
    const framework = new ExtractionFramework(mockLogger);
    framework.register(new GenericExtractor());
    const runner = new DerivationRunner({ db, extractionFramework: framework, logger: mockLogger });

    const scope: DerivationScope = {
      workspaceId: '00000000-0000-0000-0000-000000000001',
      layer: 'l1',
      ids: ['00000000-0000-0000-0000-000000000010'],
    };

    const id = await runner.enqueue('relink', scope);
    expect(derivationRuns[0]!['scope']).toEqual(scope);
  });
});
