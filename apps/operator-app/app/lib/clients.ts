import 'server-only';
import { createAdminClient } from '@vita/integrations/supabase';
import { OpenRouterClient } from '@vita/integrations/openrouter';
import { NangoClient } from '@vita/integrations/nango';
import { readWorkspace } from './workspace-store';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getSupabase(): Promise<SupabaseClient | null> {
  const w = await readWorkspace();
  if (!w.supabase?.url || !w.supabase?.serviceRoleKey) return null;
  return createAdminClient({ url: w.supabase.url, serviceRoleKey: w.supabase.serviceRoleKey });
}

export async function getOpenRouter(): Promise<OpenRouterClient | null> {
  const w = await readWorkspace();
  if (!w.openrouter?.apiKey) return null;
  const cfg: ConstructorParameters<typeof OpenRouterClient>[0] = {
    apiKey: w.openrouter.apiKey,
    appName: 'VitaOS',
    appUrl: 'https://vitaos.app',
  };
  if (w.openrouter.defaultModel) cfg.defaultModel = w.openrouter.defaultModel;
  if (w.openrouter.embeddingModel) cfg.embeddingModel = w.openrouter.embeddingModel;
  return new OpenRouterClient(cfg);
}

export async function getNango(): Promise<NangoClient | null> {
  const w = await readWorkspace();
  if (!w.nango?.secretKey) return null;
  return new NangoClient({ secretKey: w.nango.secretKey });
}

export async function requireWorkspaceId(): Promise<string | null> {
  const w = await readWorkspace();
  return w.workspaceId ?? null;
}
