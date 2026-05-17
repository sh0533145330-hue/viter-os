/**
 * OAuth helpers — PKCE generation, state nonce, redirect URL
 * builders. Stays small and dependency-free so it is safe to ship
 * to the OSS surface.
 */

import { createHash, randomBytes } from 'node:crypto';

/** Base64url encoding without padding. */
export function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

/** Generate an opaque OAuth `state` value with at least 128 bits of entropy. */
export function generateOAuthState(bytes = 32): string {
  return base64UrlEncode(randomBytes(bytes));
}

export interface PkceChallenge {
  readonly verifier: string;
  readonly challenge: string;
  readonly method: 'S256';
}

/** Generate a PKCE verifier + S256 challenge pair. */
export function generatePkcePair(bytes = 32): PkceChallenge {
  const verifier = base64UrlEncode(randomBytes(bytes));
  const challenge = base64UrlEncode(createHash('sha256').update(verifier).digest());
  return { verifier, challenge, method: 'S256' };
}

export interface AuthorizationUrlParams {
  readonly authorizeUrl: string;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scopes: readonly string[];
  readonly state: string;
  readonly pkceChallenge?: string | undefined;
  readonly extra?: Readonly<Record<string, string>> | undefined;
}

/** Build a fully-formed authorization URL for an OAuth provider. */
export function buildAuthorizationUrl(params: AuthorizationUrlParams): string {
  const url = new URL(params.authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('scope', params.scopes.join(' '));
  url.searchParams.set('state', params.state);
  if (params.pkceChallenge) {
    url.searchParams.set('code_challenge', params.pkceChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }
  if (params.extra) {
    for (const [k, v] of Object.entries(params.extra)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}
