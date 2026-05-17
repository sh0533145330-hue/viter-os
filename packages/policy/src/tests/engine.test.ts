import { describe, expect, it } from 'vitest';
import { authorize, createPolicyEngine } from '../engine.js';
import type { Principal, Resource } from '../types.js';

const UUID_USER = '00000000-0000-4000-8000-000000000001';
const UUID_WS = '00000000-0000-4000-8000-000000000a01';
const UUID_OTHER_WS = '00000000-0000-4000-8000-000000000a02';
const UUID_AGENCY = '00000000-0000-4000-8000-000000000b01';
const UUID_PLATFORM = '00000000-0000-4000-8000-000000000c01';

function workspacePrincipal(role: string): Principal {
  return {
    type: 'User',
    id: UUID_USER,
    memberships: [{ kind: 'workspace', id: UUID_WS, role, scopes: [] }],
    activeScope: { kind: 'workspace', id: UUID_WS },
  };
}

function workspaceResource(id: string = UUID_WS): Resource {
  return { type: 'Workspace', id, workspaceId: id };
}

describe('placeholder policy engine', () => {
  it('allows admins to perform any action in their workspace', () => {
    const decision = authorize(
      workspacePrincipal('admin'),
      { type: 'Action', id: 'workspace:delete' },
      workspaceResource(),
    );
    expect(decision.effect).toBe('allow');
  });

  it('allows viewers to read their workspace', () => {
    const decision = authorize(
      workspacePrincipal('viewer'),
      { type: 'Action', id: 'workspace:read' },
      workspaceResource(),
    );
    expect(decision.effect).toBe('allow');
  });

  it('denies viewers from writing', () => {
    const decision = authorize(
      workspacePrincipal('viewer'),
      { type: 'Action', id: 'ontology:write' },
      workspaceResource(),
    );
    expect(decision.effect).toBe('deny');
  });

  it('denies cross-workspace access', () => {
    const decision = authorize(
      workspacePrincipal('admin'),
      { type: 'Action', id: 'workspace:read' },
      workspaceResource(UUID_OTHER_WS),
    );
    expect(decision.effect).toBe('deny');
  });

  it('allows agency operators to read workspaces under their agency', () => {
    const principal: Principal = {
      type: 'User',
      id: UUID_USER,
      memberships: [{ kind: 'agency', id: UUID_AGENCY, role: 'operator', scopes: [] }],
      activeScope: { kind: 'agency', id: UUID_AGENCY },
    };
    const resource: Resource = {
      type: 'Workspace',
      id: UUID_WS,
      workspaceId: UUID_WS,
      agencyId: UUID_AGENCY,
    };
    const decision = authorize(principal, { type: 'Action', id: 'workspace:read' }, resource);
    expect(decision.effect).toBe('allow');
  });

  it('allows platform admins to act on any agency they own', () => {
    const principal: Principal = {
      type: 'User',
      id: UUID_USER,
      memberships: [{ kind: 'platform', id: UUID_PLATFORM, role: 'admin', scopes: [] }],
      activeScope: { kind: 'platform', id: UUID_PLATFORM },
    };
    const resource: Resource = {
      type: 'Agency',
      id: UUID_AGENCY,
      agencyId: UUID_AGENCY,
      platformId: UUID_PLATFORM,
    };
    const decision = authorize(principal, { type: 'Action', id: 'agency:update' }, resource);
    expect(decision.effect).toBe('allow');
  });
});

describe('createPolicyEngine', () => {
  it('returns an engine with the same authorize contract', () => {
    const engine = createPolicyEngine();
    const decision = engine.authorize(
      workspacePrincipal('admin'),
      { type: 'Action', id: 'workspace:read' },
      workspaceResource(),
    );
    expect(decision).toMatchObject({ effect: 'allow' });
    expect(Array.isArray(decision.policies)).toBe(true);
  });
});
