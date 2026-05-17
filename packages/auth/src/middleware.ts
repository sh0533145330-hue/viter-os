import type { CookieMethods } from '@supabase/ssr';
import type { AuthClientConfig } from './client.js';
import { createServerAuthClient } from './client.js';

export interface NextLikeRequest {
  cookies: {
    get(name: string): { name: string; value: string } | undefined;
    getAll(): Array<{ name: string; value: string }>;
    set?(cookie: { name: string; value: string } & Record<string, unknown>): void;
  };
  headers: { get(name: string): string | null };
}

export interface NextLikeResponse {
  cookies: {
    set(cookie: { name: string; value: string } & Record<string, unknown>): void;
    delete?(name: string): void;
  };
  headers: { set(name: string, value: string): void };
}

export interface AuthMiddlewareResult {
  user: { id: string; email?: string } | null;
}

function cookiesFromNext(req: NextLikeRequest, res: NextLikeResponse): CookieMethods {
  return {
    get(name) {
      return req.cookies.get(name)?.value;
    },
    set(name, value, options) {
      res.cookies.set({ name, value, ...(options ?? {}) });
    },
    remove(name, options) {
      res.cookies.set({ name, value: '', ...(options ?? {}), maxAge: 0 });
    },
  };
}

export async function refreshAuthSession(
  config: AuthClientConfig,
  req: NextLikeRequest,
  res: NextLikeResponse,
): Promise<AuthMiddlewareResult> {
  const supabase = await createServerAuthClient(config, {
    cookies: cookiesFromNext(req, res),
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { user: null };
  const user = data.user;
  return {
    user: {
      id: user.id,
      ...(user.email !== undefined ? { email: user.email } : {}),
    },
  };
}

export interface MiddlewareConfig extends AuthClientConfig {
  publicPaths?: string[];
  loginPath?: string;
}

export function isPublicPath(pathname: string, publicPaths: string[]): boolean {
  for (const pattern of publicPaths) {
    if (pattern === pathname) return true;
    if (pattern.endsWith('*') && pathname.startsWith(pattern.slice(0, -1))) return true;
  }
  return false;
}
