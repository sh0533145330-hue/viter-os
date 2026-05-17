import type { CookieMethods } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthClientConfig {
  url: string;
  anonKey: string;
}

export interface ServerClientOptions {
  cookies: CookieMethods;
  global?: Record<string, unknown>;
  cookieOptions?: Record<string, unknown>;
}

export interface BrowserClientOptions {
  global?: Record<string, unknown>;
  cookieOptions?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function createServerAuthClient(
  config: AuthClientConfig,
  options: ServerClientOptions,
): Promise<SupabaseClient> {
  const mod = await import('@supabase/ssr');
  return mod.createServerClient(config.url, config.anonKey, {
    cookies: options.cookies,
    ...(options.global !== undefined ? { global: options.global } : {}),
    ...(options.cookieOptions !== undefined ? { cookieOptions: options.cookieOptions } : {}),
  });
}

export async function createBrowserAuthClient(
  config: AuthClientConfig,
  options: BrowserClientOptions = {},
): Promise<SupabaseClient> {
  const mod = await import('@supabase/ssr');
  return mod.createBrowserClient(config.url, config.anonKey, options);
}

export interface CreateAuthClientOptions {
  runtime?: 'server' | 'browser';
  server?: ServerClientOptions;
  browser?: BrowserClientOptions;
}

export async function createAuthClient(
  config: AuthClientConfig,
  options: CreateAuthClientOptions = {},
): Promise<SupabaseClient> {
  const hasWindow =
    typeof globalThis !== 'undefined' && (globalThis as { window?: unknown }).window !== undefined;
  const runtime = options.runtime ?? (hasWindow ? 'browser' : 'server');
  if (runtime === 'server') {
    if (!options.server) {
      throw new Error('server runtime requires options.server.cookies');
    }
    return createServerAuthClient(config, options.server);
  }
  return createBrowserAuthClient(config, options.browser ?? {});
}
