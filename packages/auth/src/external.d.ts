declare module '@supabase/supabase-js' {
  export interface User {
    id: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  }
  export interface Session {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    user: User;
  }
  export interface SupabaseClient {
    auth: {
      getUser(token?: string): Promise<{ data: { user: User | null }; error: unknown }>;
      getSession(): Promise<{ data: { session: Session | null }; error: unknown }>;
      refreshSession(): Promise<{ data: { session: Session | null }; error: unknown }>;
    };
    [key: string]: unknown;
  }
  export function createClient(url: string, anonKey: string, options?: unknown): SupabaseClient;
}

declare module '@supabase/ssr' {
  import type { SupabaseClient } from '@supabase/supabase-js';
  export interface CookieMethods {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    remove(name: string, options?: Record<string, unknown>): void;
  }
  export interface CookieOptionsCarrier {
    cookies: CookieMethods;
  }
  export function createServerClient(
    url: string,
    anonKey: string,
    options: CookieOptionsCarrier & Record<string, unknown>,
  ): SupabaseClient;
  export function createBrowserClient(
    url: string,
    anonKey: string,
    options?: Record<string, unknown>,
  ): SupabaseClient;
}
