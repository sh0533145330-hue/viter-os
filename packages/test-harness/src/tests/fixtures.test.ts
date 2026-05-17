import { describe, expect, it } from 'vitest';
import {
  _resetAgentCounter,
  _resetPackCounter,
  _resetWorkspaceCounter,
  createTestAgent,
  createTestPack,
  createTestUser,
  createTestWorkspace,
  testAgentSchema,
  testPackSchema,
  testUserSchema,
  testWorkspaceSchema,
} from '../fixtures/index.js';
import type { FixtureWriter } from '../fixtures/workspaces.js';

describe('createTestWorkspace', () => {
  it('creates a schema-valid workspace with defaults', async () => {
    _resetWorkspaceCounter();
    const ws = await createTestWorkspace();
    expect(testWorkspaceSchema.safeParse(ws).success).toBe(true);
    expect(ws.id.startsWith('ws_')).toBe(true);
    expect(ws.agencyId).toBeNull();
  });

  it('honors overrides', async () => {
    const ws = await createTestWorkspace({
      seed: 42,
      name: 'Acme',
      slug: 'acme',
      verticalPackId: 'pack_cpa',
    });
    expect(ws.id).toBe('ws_000042');
    expect(ws.name).toBe('Acme');
    expect(ws.verticalPackId).toBe('pack_cpa');
  });

  it('passes the row through writer.insert when provided', async () => {
    const inserts: Array<{ table: string; row: unknown }> = [];
    const writer: FixtureWriter = {
      insert(table, row) {
        inserts.push({ table, row });
        return row;
      },
    };
    await createTestWorkspace({ seed: 7 }, writer);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.table).toBe('workspaces');
  });
});

describe('createTestUser', () => {
  it('creates a schema-valid user with a generated email', async () => {
    const user = await createTestUser({ seed: 1 });
    expect(testUserSchema.safeParse(user).success).toBe(true);
    expect(user.email).toMatch(/@example\.com$/);
  });
});

describe('createTestPack', () => {
  it('creates a draft pack scoped to a workspace', async () => {
    _resetPackCounter();
    const pack = await createTestPack({ workspaceId: 'ws_x' });
    expect(testPackSchema.safeParse(pack).success).toBe(true);
    expect(pack.workspaceId).toBe('ws_x');
    expect(pack.status).toBe('draft');
  });
});

describe('createTestAgent', () => {
  it('creates a schema-valid agent with optional evalSuiteId', async () => {
    _resetAgentCounter();
    const agent = await createTestAgent({
      workspaceId: 'ws_x',
      evalSuiteId: 'suite_1',
    });
    expect(testAgentSchema.safeParse(agent).success).toBe(true);
    expect(agent.evalSuiteId).toBe('suite_1');
  });
});
