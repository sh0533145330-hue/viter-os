/**
 * Tests for OntologyRegistry — CRUD + overlay resolution.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OntologyRegistry } from '../registry.js';
import type { Db, Logger, ScopeRef, ObjectTypeDefinition } from '../types.js';

// ---------------------------------------------------------------------------
// Mock DB with controllable storage
// ---------------------------------------------------------------------------

let objectTypesStore: Array<Record<string, unknown>> = [];
let workspacesStore: Array<Record<string, unknown>> = [];
let nextId = 1;

function createMockDb(): Db {
  return {
    insert: vi.fn().mockImplementation((_table: Record<string, unknown>) => ({
      values: vi.fn().mockImplementation((...rows: unknown[]) => {
        const items = Array.isArray(rows) ? rows : [rows];
        for (const item of items) {
          const row = item as Record<string, unknown>;
          const id = `auto-id-${nextId++}`;
          // Route to the right store based on table hint in _table or row keys
          if ('scope' in row && 'key' in row) {
            objectTypesStore.push({ ...row, id });
          } else if ('agency_id' in row || 'run_kind' in row || 'link_type' in row) {
            // Ignore non-object-type inserts
          } else {
            objectTypesStore.push({ ...row, id });
          }
        }
        // Return the last inserted row
        const lastRow = objectTypesStore[objectTypesStore.length - 1];
        return { returning: vi.fn().mockResolvedValue(lastRow ? [lastRow] : []) };
      }),
    })),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockImplementation((table: unknown) => ({
        where: vi.fn().mockImplementation((cond: unknown) => {
          if (typeof cond !== 'object' || cond === null) return Promise.resolve([]);

          // Determine which store to query
          const tableName = typeof table === 'string' ? table : '';
          const store = tableName === 'workspaces' ? workspacesStore : objectTypesStore;

          const c = cond as Record<string, unknown>;
          return Promise.resolve(
            store.filter((row) => {
              if (c['scope'] !== undefined && row['scope'] !== c['scope']) return false;
              if (c['scope_id'] !== undefined && row['scope_id'] !== c['scope_id']) return false;
              if (c['key'] !== undefined && row['key'] !== c['key']) return false;
              // deleted_at: null means "not deleted" — treat undefined as null
              if (c['deleted_at'] !== undefined) {
                const rowDeletedAt = row['deleted_at'] ?? null;
                if (rowDeletedAt !== c['deleted_at']) return false;
              }
              if (c['id'] !== undefined && row['id'] !== c['id']) return false;
              if (c['workspace_id'] !== undefined && row['workspace_id'] !== c['workspace_id']) return false;
              return true;
            }),
          );
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(objectTypesStore),
        }),
      })),
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
// Sample definitions
// ---------------------------------------------------------------------------

const publicPersonDef: ObjectTypeDefinition = {
  key: 'person',
  name: 'Person',
  description: 'A human being',
  properties: {
    name: { type: 'string', required: true },
    email: { type: 'string' },
    title: { type: 'string' },
  },
};

const agencyOverlayDef: ObjectTypeDefinition = {
  key: 'person',
  name: 'Person',
  description: 'Agency person override',
  properties: {
    department: { type: 'string' },
    clearance: { type: 'string' },
    title: { type: 'string' }, // Override public title
  },
};

const workspaceOverlayDef: ObjectTypeDefinition = {
  key: 'person',
  name: 'Person',
  description: 'Workspace person override',
  properties: {
    localRole: { type: 'string' },
    clearance: { type: 'string', required: true }, // Override agency clearance
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OntologyRegistry', () => {
  beforeEach(() => {
    objectTypesStore = [];
    workspacesStore = [];
    nextId = 1;
    vi.clearAllMocks();
  });

  it('creates an ObjectType in a scope', async () => {
    const db = createMockDb();
    const registry = new OntologyRegistry({ db, logger: mockLogger });

    const scope: ScopeRef = { scope: 'public', scopeId: null };
    const id = await registry.createObjectType(scope, publicPersonDef);

    expect(id).toBeTruthy();
    expect(objectTypesStore.length).toBe(1);
    expect(objectTypesStore[0]!['key']).toBe('person');
    expect(objectTypesStore[0]!['scope']).toBe('public');
  });

  it('gets an ObjectType by scope and key', async () => {
    const db = createMockDb();
    const registry = new OntologyRegistry({ db, logger: mockLogger });

    const scope: ScopeRef = { scope: 'public', scopeId: null };
    await registry.createObjectType(scope, publicPersonDef);

    const result = await registry.getObjectType(scope, 'person');

    expect(result).toBeDefined();
    expect(result!.key).toBe('person');
    expect(result!.properties['name']).toBeDefined();
  });

  it('returns undefined for non-existent ObjectType', async () => {
    const db = createMockDb();
    const registry = new OntologyRegistry({ db, logger: mockLogger });

    const scope: ScopeRef = { scope: 'public', scopeId: null };
    const result = await registry.getObjectType(scope, 'nonexistent');

    expect(result).toBeUndefined();
  });

  it('lists all ObjectTypes in a scope', async () => {
    const db = createMockDb();
    const registry = new OntologyRegistry({ db, logger: mockLogger });

    const scope: ScopeRef = { scope: 'public', scopeId: null };
    await registry.createObjectType(scope, publicPersonDef);
    await registry.createObjectType(scope, {
      key: 'organization',
      name: 'Organization',
      description: 'A company or group',
      properties: {
        name: { type: 'string', required: true },
        industry: { type: 'string' },
      },
    });

    const types = await registry.listObjectTypes(scope);

    expect(types.length).toBe(2);
    expect(types.some((t) => t.key === 'person')).toBe(true);
    expect(types.some((t) => t.key === 'organization')).toBe(true);
  });

  it('resolves effective ObjectType with overlays', async () => {
    const db = createMockDb();
    const registry = new OntologyRegistry({ db, logger: mockLogger });

    const publicScope: ScopeRef = { scope: 'public', scopeId: null };
    const agencyScope: ScopeRef = { scope: 'agency', scopeId: 'agency-1' };
    const workspaceScope: ScopeRef = { scope: 'workspace', scopeId: 'ws-1' };

    // Create definitions at all three levels
    await registry.createObjectType(publicScope, publicPersonDef);
    await registry.createObjectType(agencyScope, agencyOverlayDef);
    await registry.createObjectType(workspaceScope, workspaceOverlayDef);

    // Set up workspace → agency mapping so resolveEffective can find the agency
    workspacesStore.push({
      id: 'ws-1',
      agency_id: 'agency-1',
      name: 'Test Workspace',
    });

    const effective = await registry.resolveEffective('ws-1', 'person');

    // Base properties from public
    expect(effective.properties['name']).toBeDefined();
    expect(effective.properties['email']).toBeDefined();

    // Agency overlay adds department and clearance
    expect(effective.properties['department']).toBeDefined();

    // Workspace overlay adds localRole
    expect(effective.properties['localRole']).toBeDefined();

    // Later overlay wins for overlapping keys (clearance has workspace's required)
    expect(effective.properties['clearance']).toBeDefined();
    expect((effective.properties['clearance'] as Record<string, unknown>)['required']).toBe(true);
  });

  it('resolves effective with just public scope (no overlays)', async () => {
    const db = createMockDb();
    const registry = new OntologyRegistry({ db, logger: mockLogger });

    const publicScope: ScopeRef = { scope: 'public', scopeId: null };
    await registry.createObjectType(publicScope, publicPersonDef);

    const effective = await registry.resolveEffective('ws-2', 'person');

    expect(effective.key).toBe('person');
    expect(Object.keys(effective.properties)).toEqual(['name', 'email', 'title']);
  });

  it('throws when resolving with no public base definition', async () => {
    const db = createMockDb();
    const registry = new OntologyRegistry({ db, logger: mockLogger });

    await expect(
      registry.resolveEffective('ws-1', 'nonexistent'),
    ).rejects.toThrow('No public ObjectType definition found');
  });

  it('creates an ActionType', async () => {
    const db = createMockDb();
    const registry = new OntologyRegistry({ db, logger: mockLogger });

    const scope: ScopeRef = { scope: 'workspace', scopeId: 'ws-1' };
    const id = await registry.createActionType(scope, {
      key: 'approve_purchase',
      name: 'Approve Purchase',
      description: 'Approve a purchase request',
      requiresApproval: true,
    });

    expect(id).toBeTruthy();
  });

  it('creates a LinkType', async () => {
    const db = createMockDb();
    const registry = new OntologyRegistry({ db, logger: mockLogger });

    const scope: ScopeRef = { scope: 'workspace', scopeId: 'ws-1' };
    await registry.createObjectType(scope, {
      key: 'person',
      name: 'Person',
      description: '',
      properties: {},
    });
    await registry.createObjectType(scope, {
      key: 'organization',
      name: 'Organization',
      description: '',
      properties: {},
    });

    const id = await registry.createLinkType(scope, {
      key: 'employed_by',
      name: 'Employed By',
      description: 'Person employed by organization',
      fromTypeKey: 'person',
      toTypeKey: 'organization',
      kind: 'N:M',
    });

    expect(id).toBeTruthy();
  });
});
