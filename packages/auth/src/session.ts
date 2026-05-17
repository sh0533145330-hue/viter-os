import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type MembershipClaim,
  type ScopeRef,
  type VitaJwtClaims,
  assertActiveScope,
  decodeClaimsUnsafe,
  parseClaims,
} from './claims.js';
import { getActiveScope } from './switcher.js';
import type { CookieJar } from './switcher.js';

export interface SessionLike {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
}

export interface VitaSession {
  user: { id: string; email?: string };
  claims: VitaJwtClaims;
  activeScope: ScopeRef;
  accessToken: string;
}

export class UnauthenticatedError extends Error {
  constructor(message = 'unauthenticated') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

export interface GetSessionOptions {
  jwtSecret?: string;
  verifySignature?: boolean;
}

export async function getSession(
  client: SupabaseClient,
  cookies: CookieJar,
  options: GetSessionOptions = {},
): Promise<VitaSession | null> {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) return null;
  const session = data.session;

  let claims: VitaJwtClaims;
  if (options.verifySignature || options.jwtSecret) {
    claims = parseClaims(session.access_token, {
      ...(options.jwtSecret !== undefined ? { secret: options.jwtSecret } : {}),
      verifySignature: options.verifySignature ?? Boolean(options.jwtSecret),
    });
  } else {
    claims = decodeClaimsUnsafe(session.access_token);
  }

  const cookieScope = getActiveScope(cookies);
  const activeScope = cookieScope ?? claims.active_scope;
  assertActiveScope(claims, activeScope);

  const user: { id: string; email?: string } = { id: session.user.id };
  if (session.user.email !== undefined) user.email = session.user.email;

  return {
    user,
    claims,
    activeScope,
    accessToken: session.access_token,
  };
}

export async function requireUser(
  client: SupabaseClient,
  cookies: CookieJar,
  options: GetSessionOptions = {},
): Promise<VitaSession> {
  const session = await getSession(client, cookies, options);
  if (!session) throw new UnauthenticatedError();
  return session;
}

export async function getActiveWorkspace(
  client: SupabaseClient,
  cookies: CookieJar,
  options: GetSessionOptions = {},
): Promise<string | null> {
  const session = await getSession(client, cookies, options);
  if (!session) return null;
  return session.activeScope.kind === 'workspace' ? session.activeScope.id : null;
}

export function membershipsForActiveScope(claims: VitaJwtClaims): MembershipClaim[] {
  return claims.memberships.filter(
    (m) => m.kind === claims.active_scope.kind && m.id === claims.active_scope.id,
  );
}
