import { type ScopeRef, scopeRefSchema } from './claims.js';

export const ACTIVE_SCOPE_COOKIE = 'vita-active-scope';

export interface CookieJar {
  get(name: string): { value: string } | undefined;
  set(cookie: { name: string; value: string } & Record<string, unknown>): void;
  delete?(name: string): void;
}

export interface SetActiveScopeOptions {
  maxAgeSeconds?: number;
  domain?: string;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
}

function encodeScope(scope: ScopeRef): string {
  return `${scope.kind}:${scope.id}`;
}

export function parseScopeCookie(value: string | undefined): ScopeRef | null {
  if (!value) return null;
  const [kind, id] = value.split(':');
  if (!kind || !id) return null;
  const parsed = scopeRefSchema.safeParse({ kind, id });
  return parsed.success ? parsed.data : null;
}

export function getActiveScope(cookies: CookieJar): ScopeRef | null {
  return parseScopeCookie(cookies.get(ACTIVE_SCOPE_COOKIE)?.value);
}

export function setActiveScope(
  cookies: CookieJar,
  scope: ScopeRef,
  options: SetActiveScopeOptions = {},
): void {
  const {
    maxAgeSeconds = 60 * 60 * 24 * 30,
    secure = true,
    sameSite = 'lax',
    path = '/',
    domain,
  } = options;
  const parsed = scopeRefSchema.parse(scope);
  const cookie: { name: string; value: string } & Record<string, unknown> = {
    name: ACTIVE_SCOPE_COOKIE,
    value: encodeScope(parsed),
    httpOnly: false,
    maxAge: maxAgeSeconds,
    sameSite,
    secure,
    path,
  };
  if (domain !== undefined) cookie.domain = domain;
  cookies.set(cookie);
}

export function clearActiveScope(cookies: CookieJar): void {
  if (cookies.delete) {
    cookies.delete(ACTIVE_SCOPE_COOKIE);
    return;
  }
  cookies.set({
    name: ACTIVE_SCOPE_COOKIE,
    value: '',
    maxAge: 0,
    path: '/',
  });
}
