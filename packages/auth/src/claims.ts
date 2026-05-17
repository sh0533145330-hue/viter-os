import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const SCOPE_KINDS = ['platform', 'agency', 'workspace'] as const;
export type ScopeKind = (typeof SCOPE_KINDS)[number];

export const scopeRefSchema = z.object({
  kind: z.enum(SCOPE_KINDS),
  id: z.string().uuid(),
});

export type ScopeRef = z.infer<typeof scopeRefSchema>;

export const membershipClaimSchema = z.object({
  kind: z.enum(SCOPE_KINDS),
  id: z.string().uuid(),
  role: z.string().min(1),
  scopes: z.array(z.string()),
});

export type MembershipClaim = z.infer<typeof membershipClaimSchema>;

export const vitaJwtClaimsSchema = z
  .object({
    sub: z.string().min(1),
    email: z.string().email().optional(),
    iss: z.literal('supabase'),
    active_scope: scopeRefSchema,
    memberships: z.array(membershipClaimSchema),
    workspace_ids: z.array(z.string().uuid()),
    agency_ids: z.array(z.string().uuid()),
    platform_ids: z.array(z.string().uuid()),
    exp: z.number().int().optional(),
    iat: z.number().int().optional(),
  })
  .passthrough();

export type VitaJwtClaims = z.infer<typeof vitaJwtClaimsSchema>;

export class JwtError extends Error {
  constructor(
    message: string,
    public readonly code: 'malformed' | 'invalid_signature' | 'expired' | 'invalid_claims',
  ) {
    super(message);
    this.name = 'JwtError';
  }
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

function base64UrlDecodeJson(input: string): unknown {
  return JSON.parse(base64UrlDecode(input).toString('utf8'));
}

const jwtHeaderSchema = z
  .object({
    alg: z.string().min(1),
    typ: z.string().optional(),
    kid: z.string().optional(),
  })
  .passthrough();

type JwtHeader = z.infer<typeof jwtHeaderSchema>;

export interface ParseClaimsOptions {
  secret?: string;
  verifySignature?: boolean;
  now?: number;
  clockSkewSeconds?: number;
}

export function decodeJwtSegments(token: string): {
  header: JwtHeader;
  payload: unknown;
  signingInput: string;
  signature: string;
} {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new JwtError('JWT must have three segments', 'malformed');
  }
  const headerSeg = parts[0] ?? '';
  const payloadSeg = parts[1] ?? '';
  const signatureSeg = parts[2] ?? '';
  if (!headerSeg || !payloadSeg || !signatureSeg) {
    throw new JwtError('JWT segments must be non-empty', 'malformed');
  }
  let header: JwtHeader;
  let payload: unknown;
  try {
    header = jwtHeaderSchema.parse(base64UrlDecodeJson(headerSeg));
    payload = base64UrlDecodeJson(payloadSeg);
  } catch (err) {
    throw new JwtError(`JWT could not be decoded: ${(err as Error).message}`, 'malformed');
  }
  return {
    header,
    payload,
    signingInput: `${headerSeg}.${payloadSeg}`,
    signature: signatureSeg,
  };
}

function verifyHs256(signingInput: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(signingInput).digest();
  const given = base64UrlDecode(signature);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function parseClaims(token: string, options: ParseClaimsOptions = {}): VitaJwtClaims {
  const { secret, verifySignature = Boolean(options.secret), now, clockSkewSeconds = 30 } = options;
  const decoded = decodeJwtSegments(token);

  if (verifySignature) {
    if (!secret) {
      throw new JwtError('signature verification requested without secret', 'invalid_signature');
    }
    if (decoded.header.alg !== 'HS256') {
      throw new JwtError(`unsupported alg ${decoded.header.alg}`, 'invalid_signature');
    }
    if (!verifyHs256(decoded.signingInput, decoded.signature, secret)) {
      throw new JwtError('JWT signature does not match', 'invalid_signature');
    }
  }

  let claims: VitaJwtClaims;
  try {
    claims = vitaJwtClaimsSchema.parse(decoded.payload);
  } catch (err) {
    throw new JwtError(`JWT claims failed validation: ${(err as Error).message}`, 'invalid_claims');
  }

  if (claims.exp !== undefined) {
    const nowSec = Math.floor((now ?? Date.now()) / 1000);
    if (claims.exp + clockSkewSeconds < nowSec) {
      throw new JwtError('JWT is expired', 'expired');
    }
  }

  return claims;
}

export function decodeClaimsUnsafe(token: string): VitaJwtClaims {
  return parseClaims(token, { verifySignature: false });
}

export interface SupabaseUserLike {
  id: string;
  email?: string | undefined;
}

export interface BuildClaimsInput {
  user: SupabaseUserLike;
  memberships: MembershipClaim[];
  activeScope: ScopeRef;
  issuedAt?: number;
  expiresAt?: number;
}

export function claimsFromSupabaseUser(input: BuildClaimsInput): VitaJwtClaims {
  const workspace_ids = collectScopeIds(input.memberships, 'workspace');
  const agency_ids = collectScopeIds(input.memberships, 'agency');
  const platform_ids = collectScopeIds(input.memberships, 'platform');

  const base: VitaJwtClaims = {
    sub: input.user.id,
    iss: 'supabase',
    active_scope: input.activeScope,
    memberships: input.memberships,
    workspace_ids,
    agency_ids,
    platform_ids,
  };
  if (input.user.email !== undefined) base.email = input.user.email;
  if (input.issuedAt !== undefined) base.iat = input.issuedAt;
  if (input.expiresAt !== undefined) base.exp = input.expiresAt;
  return vitaJwtClaimsSchema.parse(base);
}

function collectScopeIds(memberships: MembershipClaim[], kind: ScopeKind): string[] {
  const set = new Set<string>();
  for (const m of memberships) {
    if (m.kind === kind) set.add(m.id);
  }
  return [...set];
}

export class TenancyAccessError extends Error {
  constructor(
    message: string,
    public readonly scope: ScopeRef,
  ) {
    super(message);
    this.name = 'TenancyAccessError';
  }
}

export function assertActiveWorkspace(claims: VitaJwtClaims, workspaceId: string): void {
  if (!claims.workspace_ids.includes(workspaceId)) {
    throw new TenancyAccessError(
      `user ${claims.sub} has no membership reaching workspace ${workspaceId}`,
      { kind: 'workspace', id: workspaceId },
    );
  }
}

export function assertActiveScope(claims: VitaJwtClaims, scope: ScopeRef): void {
  const pool =
    scope.kind === 'workspace'
      ? claims.workspace_ids
      : scope.kind === 'agency'
        ? claims.agency_ids
        : claims.platform_ids;
  if (!pool.includes(scope.id)) {
    throw new TenancyAccessError(
      `user ${claims.sub} cannot activate ${scope.kind} ${scope.id}`,
      scope,
    );
  }
}
