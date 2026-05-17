'use server';
import { revalidatePath } from 'next/cache';
import { runSync, NANGO_PROVIDER_REGISTRY } from '@vita/integrations';
import { getSupabase, getOpenRouter, getNango, requireWorkspaceId } from '../lib/clients';
import { readWorkspace } from '../lib/workspace-store';
import type { SourceConfig } from '@vita/integrations';

export interface SourceRow {
  id: string;
  kind: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  lastSyncCount: number;
  lastError: string | null;
  config: SourceConfig;
  tier: string;
}

export async function listSources(): Promise<SourceRow[]> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return [];
  const { data } = await supabase
    .from('sources')
    .select('id,kind,label,status,last_sync_at,last_sync_count,last_error,config')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(r => {
    const cfg = (r.config as SourceConfig | null) ?? { tier: 'rest', kind: r.kind as string };
    return {
      id: r.id as string,
      kind: r.kind as string,
      label: (r.label as string | null) ?? null,
      status: (r.status as string) ?? 'pending',
      lastSyncAt: (r.last_sync_at as string | null) ?? null,
      lastSyncCount: (r.last_sync_count as number) ?? 0,
      lastError: (r.last_error as string | null) ?? null,
      config: cfg,
      tier: cfg.tier,
    };
  });
}

export async function addNangoSource(opts: { provider: string; connectionId: string; label?: string }): Promise<{ ok: boolean; id?: string; message: string }> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return { ok: false, message: 'Workspace not connected.' };
  const meta = NANGO_PROVIDER_REGISTRY[opts.provider];
  if (!meta) return { ok: false, message: `Unknown Nango provider: ${opts.provider}` };
  const config: SourceConfig = {
    tier: 'nango', kind: opts.provider,
    label: opts.label ?? meta.displayName,
    nango: { provider: opts.provider, connectionId: opts.connectionId },
  };
  const { data, error } = await supabase.from('sources').insert({
    workspace_id: wsId, kind: opts.provider, label: opts.label ?? meta.displayName,
    status: 'pending', config,
  }).select('id').single();
  if (error || !data) return { ok: false, message: error?.message ?? 'Insert failed' };
  revalidatePath('/app/connectors');
  return { ok: true, id: data.id as string, message: 'Source added.' };
}

export async function addRestSource(opts: {
  label: string; baseUrl: string; listPath: string; listJsonPath: string;
  idField: string; titleField: string; bodyField?: string; urlField?: string; updatedAtField?: string;
  authHeader: string; authValue: string; type: string;
}): Promise<{ ok: boolean; id?: string; message: string }> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return { ok: false, message: 'Workspace not connected.' };
  const kind = opts.label.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40) || 'custom-rest';
  const rest: NonNullable<SourceConfig['rest']> = {
    baseUrl: opts.baseUrl, listPath: opts.listPath, listJsonPath: opts.listJsonPath,
    idField: opts.idField, titleField: opts.titleField,
    authHeader: opts.authHeader, authValue: opts.authValue, type: opts.type,
  };
  if (opts.bodyField) rest.bodyField = opts.bodyField;
  if (opts.urlField) rest.urlField = opts.urlField;
  if (opts.updatedAtField) rest.updatedAtField = opts.updatedAtField;
  const config: SourceConfig = { tier: 'rest', kind, label: opts.label, rest };
  const { data, error } = await supabase.from('sources').insert({
    workspace_id: wsId, kind, label: opts.label, status: 'pending', config,
  }).select('id').single();
  if (error || !data) return { ok: false, message: error?.message ?? 'Insert failed' };
  revalidatePath('/app/connectors');
  return { ok: true, id: data.id as string, message: 'REST source added.' };
}

export async function syncSourceNow(sourceId: string): Promise<{ ok: boolean; fetched: number; upserted: number; embedded: number; errors: string[] }> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  const openrouter = await getOpenRouter();
  const w = await readWorkspace();
  if (!supabase || !wsId) return { ok: false, fetched: 0, upserted: 0, embedded: 0, errors: ['Workspace not connected'] };
  const deps: Parameters<typeof runSync>[0] = { supabase, workspaceId: wsId };
  if (openrouter) deps.openrouter = openrouter;
  if (w.openrouter?.embeddingModel) deps.embedModel = w.openrouter.embeddingModel;
  if (w.nango?.secretKey) deps.nango = { secretKey: w.nango.secretKey };
  const result = await runSync(deps, sourceId);
  revalidatePath('/app/connectors');
  revalidatePath('/app');
  return { ok: result.errors.length === 0 || result.upserted > 0, fetched: result.fetched, upserted: result.upserted, embedded: result.embedded, errors: result.errors };
}

export async function deleteSource(sourceId: string): Promise<{ ok: boolean }> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return { ok: false };
  await supabase.from('sources').delete().eq('id', sourceId).eq('workspace_id', wsId);
  revalidatePath('/app/connectors');
  return { ok: true };
}

export async function listNangoConnections(): Promise<Array<{ connectionId: string; provider: string; providerConfigKey: string }>> {
  const nango = await getNango();
  if (!nango) return [];
  try {
    const conns = await nango.listConnections();
    return conns.map(c => ({ connectionId: c.connectionId, provider: c.provider, providerConfigKey: c.providerConfigKey }));
  } catch {
    return [];
  }
}
