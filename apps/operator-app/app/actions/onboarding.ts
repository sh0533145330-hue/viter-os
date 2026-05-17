'use server';
import { createAdminClient, testAdminConnection, SCHEMA_SQL, checkSchema } from '@vita/integrations/supabase';
import { OpenRouterClient } from '@vita/integrations/openrouter';
import { NangoClient } from '@vita/integrations/nango';
import { readWorkspace, writeWorkspace } from '../lib/workspace-store';

export async function saveWorkspaceMeta(name: string, industry: string): Promise<{ ok: boolean }> {
  await writeWorkspace({ workspaceName: name, industry });
  return { ok: true };
}

export async function testAndSaveSupabase(url: string, serviceRoleKey: string): Promise<{ ok: boolean; message: string; schemaReady?: boolean }> {
  const test = await testAdminConnection({ url, serviceRoleKey });
  if (!test.ok) return { ok: false, message: test.message };
  await writeWorkspace({ supabase: { url, serviceRoleKey } });
  const schema = await checkSchema({ url, serviceRoleKey });
  return { ok: true, message: test.message, schemaReady: schema.ok };
}

export async function getSchemaSQL(): Promise<string> {
  return SCHEMA_SQL;
}

export async function bootstrapWorkspaceRow(): Promise<{ ok: boolean; workspaceId?: string; message: string }> {
  const w = await readWorkspace();
  if (!w.supabase) return { ok: false, message: 'Supabase not configured.' };
  const client = createAdminClient(w.supabase);
  const existing = await client.from('workspaces').select('id').limit(1).maybeSingle();
  if (existing.data?.id) {
    await writeWorkspace({ workspaceId: existing.data.id as string });
    return { ok: true, workspaceId: existing.data.id as string, message: 'Using existing workspace row.' };
  }
  const insert = await client.from('workspaces').insert({
    name: w.workspaceName ?? 'My workspace',
    industry: w.industry ?? null,
  }).select('id').single();
  if (insert.error || !insert.data) {
    return { ok: false, message: insert.error?.message ?? 'Failed to create workspace row. Run the schema SQL in Supabase first.' };
  }
  await writeWorkspace({ workspaceId: insert.data.id as string });
  return { ok: true, workspaceId: insert.data.id as string, message: 'Workspace created.' };
}

export async function testAndSaveOpenRouter(apiKey: string): Promise<{ ok: boolean; message: string; models?: number }> {
  const client = new OpenRouterClient({ apiKey, appName: 'VitaOS' });
  const test = await client.test();
  if (!test.ok) return { ok: false, message: test.message };
  await writeWorkspace({ openrouter: { apiKey, defaultModel: 'anthropic/claude-3.5-sonnet', embeddingModel: 'openai/text-embedding-3-small' } });
  const result: { ok: boolean; message: string; models?: number } = { ok: true, message: test.message };
  if (test.models !== undefined) result.models = test.models;
  return result;
}

export async function testAndSaveNango(secretKey: string): Promise<{ ok: boolean; message: string; connectionCount?: number }> {
  if (!secretKey) {
    // Clear nango by reading current creds, removing the key, and rewriting
    const w = await readWorkspace();
    const { nango: _removed, ...rest } = w;
    void _removed;
    await writeWorkspace(rest);
    return { ok: true, message: 'Nango skipped — REST + custom connectors available.' };
  }
  const client = new NangoClient({ secretKey });
  const test = await client.test();
  if (!test.ok) return { ok: false, message: test.message };
  await writeWorkspace({ nango: { secretKey } });
  const result: { ok: boolean; message: string; connectionCount?: number } = { ok: true, message: test.message };
  if (test.connectionCount !== undefined) result.connectionCount = test.connectionCount;
  return result;
}

export async function saveAgentSettings(opts: { autonomyDefault: 'L1' | 'L2' | 'L3' | 'L4'; tomName?: string; timName?: string }): Promise<{ ok: boolean }> {
  const patch: { autonomyDefault: 'L1' | 'L2' | 'L3' | 'L4'; tomName?: string; timName?: string } = { autonomyDefault: opts.autonomyDefault };
  if (opts.tomName) patch.tomName = opts.tomName;
  if (opts.timName) patch.timName = opts.timName;
  await writeWorkspace(patch);
  return { ok: true };
}

export async function getOnboardingState(): Promise<{
  hasWorkspaceMeta: boolean;
  hasSupabase: boolean;
  hasSchema: boolean;
  hasWorkspaceId: boolean;
  hasOpenRouter: boolean;
  hasNango: boolean;
  hasAgentSettings: boolean;
}> {
  const w = await readWorkspace();
  let schemaReady = false;
  if (w.supabase) {
    const r = await checkSchema(w.supabase);
    schemaReady = r.ok;
  }
  return {
    hasWorkspaceMeta: Boolean(w.workspaceName),
    hasSupabase: Boolean(w.supabase?.url),
    hasSchema: schemaReady,
    hasWorkspaceId: Boolean(w.workspaceId),
    hasOpenRouter: Boolean(w.openrouter?.apiKey),
    hasNango: Boolean(w.nango?.secretKey),
    hasAgentSettings: Boolean(w.autonomyDefault),
  };
}
