import { Buffer } from 'node:buffer';
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  JwtError,
  type MembershipClaim,
  TenancyAccessError,
  type VitaJwtClaims,
  assertActiveScope,
  assertActiveWorkspace,
  claimsFromSupabaseUser,
  decodeClaimsUnsafe,
  parseClaims,
  vitaJwtClaimsSchema,
} from '../claims.js';

const UUID_USER = '00000000-0000-4000-8000-000000000001';
const UUID_WS_A = '00000000-0000-4000-8000-000000000a01';
const UUID_WS_B = '00000000-0000-4000-8000-000000000a02';
const UUID_AGENCY = '00000000-0000-4000-8000-000000000b01';
const UUID_PLATFORM = '00000000-0000-4000-8000-000000000c01';

function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf;
  return b.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signHs256(
  payload: Record<string, unknown>,
  secret: string,
  header: Record<string, unknown> = {},
): string {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', ...header }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest();
  return `${head}.${body}.${b64url(sig)}`;
}

const baseMemberships: MembershipClaim[] = [
  { kind: 'workspace', id: UUID_WS_A, role: 'admin', scopes: ['ontology:read'] },
  { kind: 'agency', id: UUID_AGENCY, role: 'operator', scopes: [] },
];

function baseClaims(overrides: Partial<VitaJwtClaims> = {}): VitaJwtClaims {
  return vitaJwtClaimsSchema.parse({
    sub: UUID_USER,
    email: 'op@example.com',
    iss: 'supabase',
    active_scope: { kind: 'workspace', id: UUID_WS_A },
    memberships: baseMemberships,
    workspace_ids: [UUID_WS_A],
    agency_ids: [UUID_AGENCY],
    platform_ids: [],
    ...overrides,
  });
}

describe('claimsFromSupabaseUser', () => {
  it('builds claims with derived scope id arrays', () => {
    const claims = claimsFromSupabaseUser({
      user: { id: UUID_USER, email: 'op@example.com' },
      memberships: [
        ...baseMemberships,
        { kind: 'workspace', id: UUID_WS_B, role: 'viewer', scopes: [] },
        { kind: 'platform', id: UUID_PLATFORM, role: 'admin', scopes: [] },
      ],
      activeScope: { kind: 'workspace', id: UUID_WS_A },
    });
    expect(claims.workspace_ids).toEqual(expect.arrayContaining([UUID_WS_A, UUID_WS_B]));
    expect(claims.agency_ids).toEqual([UUID_AGENCY]);
    expect(claims.platform_ids).toEqual([UUID_PLATFORM]);
    expect(claims.email).toBe('op@example.com');
  });

  it('omits email when not provided (exactOptionalPropertyTypes)', () => {
    const claims = claimsFromSupabaseUser({
      user: { id: UUID_USER },
      memberships: baseMemberships,
      activeScope: { kind: 'workspace', id: UUID_WS_A },
    });
    expect('email' in claims).toBe(false);
  });
});

describe('parseClaims', () => {
  it('decodes unverified claims', () => {
    const claims = baseClaims();
    const token = signHs256(claims, 'unused');
    const out = decodeClaimsUnsafe(token);
    expect(out.sub).toBe(UUID_USER);
    expect(out.active_scope.id).toBe(UUID_WS_A);
  });

  it('verifies HS256 signature with the Supabase JWT secret', () => {
    const claims = baseClaims();
    const secret = 'super-secret-supabase-jwt';
    const token = signHs256(claims, secret);
    const out = parseClaims(token, { secret });
    expect(out.sub).toBe(UUID_USER);
  });

  it('rejects tampered signatures', () => {
    const claims = baseClaims();
    const token = signHs256(claims, 'real-secret');
    expect(() => parseClaims(token, { secret: 'attacker-secret' })).toThrowError(JwtError);
  });

  it('rejects malformed tokens', () => {
    expect(() => parseClaims('not.a.token.extra', { verifySignature: false })).toThrowError(
      /three segments/,
    );
    expect(() => parseClaims('only-one-segment', { verifySignature: false })).toThrowError(
      /three segments/,
    );
  });

  it('rejects expired tokens', () => {
    const claims = baseClaims({ exp: 1000 });
    const token = signHs256(claims, 'unused');
    expect(() => parseClaims(token, { verifySignature: false, now: 5_000_000 })).toThrowError(
      /expired/,
    );
  });

  it('rejects malformed claim shape', () => {
    const bad = signHs256({ sub: UUID_USER, iss: 'supabase' }, 'unused');
    expect(() => parseClaims(bad, { verifySignature: false })).toThrowError(JwtError);
  });
});

describe('assertActiveWorkspace / assertActiveScope', () => {
  it('passes when workspace is reachable', () => {
    expect(() => assertActiveWorkspace(baseClaims(), UUID_WS_A)).not.toThrow();
  });

  it('throws on cross-tenant workspace activation', () => {
    expect(() => assertActiveWorkspace(baseClaims(), UUID_WS_B)).toThrowError(TenancyAccessError);
  });

  it('checks active scope across kinds', () => {
    const claims = baseClaims({
      platform_ids: [UUID_PLATFORM],
      active_scope: { kind: 'platform', id: UUID_PLATFORM },
    });
    expect(() => assertActiveScope(claims, { kind: 'platform', id: UUID_PLATFORM })).not.toThrow();
    expect(() => assertActiveScope(claims, { kind: 'agency', id: UUID_AGENCY })).not.toThrow();
    expect(() => assertActiveScope(claims, { kind: 'workspace', id: UUID_WS_B })).toThrowError(
      TenancyAccessError,
    );
  });
});
