import type { SupabaseClient } from '@supabase/supabase-js';
import type { IngestedEntity, SourceConfig } from './types.js';
import { NangoConnector } from './connectors/nango-connector.js';
import { GenericRestConnector } from './connectors/rest-connector.js';
import type { NangoConfig } from './nango.js';
import type { OpenRouterClient } from './openrouter.js';

export interface IngestDeps {
  supabase: SupabaseClient;
  workspaceId: string;
  nango?: NangoConfig;
  openrouter?: OpenRouterClient;
  embedModel?: string;
}

export interface SyncRunSummary {
  sourceId: string;
  fetched: number;
  upserted: number;
  embedded: number;
  errors: string[];
}

export async function runSync(deps: IngestDeps, sourceId: string): Promise<SyncRunSummary> {
  const errors: string[] = [];
  const summary: SyncRunSummary = { sourceId, fetched: 0, upserted: 0, embedded: 0, errors };

  const { data: source, error: srcErr } = await deps.supabase
    .from('sources')
    .select('*')
    .eq('id', sourceId)
    .single();
  if (srcErr || !source) {
    errors.push(`Source not found: ${srcErr?.message ?? 'no row'}`);
    return summary;
  }

  const cfg: SourceConfig = (source.config as SourceConfig) ?? { tier: 'rest', kind: source.kind };
  const { data: runRow } = await deps.supabase
    .from('sync_runs')
    .insert({ workspace_id: deps.workspaceId, source_id: sourceId, status: 'running' })
    .select('id')
    .single();

  let entities: IngestedEntity[] = [];
  if (cfg.tier === 'nango') {
    if (!deps.nango) { errors.push('Nango not configured.'); }
    else {
      const conn = new NangoConnector(deps.nango);
      const result = await conn.sync(cfg, { limit: 50 });
      entities = result.entities;
      errors.push(...result.errors);
    }
  } else if (cfg.tier === 'rest') {
    const conn = new GenericRestConnector();
    const result = await conn.sync(cfg);
    entities = result.entities;
    errors.push(...result.errors);
  } else {
    errors.push(`Tier "${cfg.tier}" not yet supported by ingest runner.`);
  }

  summary.fetched = entities.length;

  for (const e of entities) {
    const row = {
      workspace_id: deps.workspaceId,
      source_id: sourceId,
      source_kind: e.sourceKind,
      external_id: e.externalId,
      type: e.type,
      title: e.title,
      body: e.body ?? null,
      url: e.url ?? null,
      author: e.author ?? null,
      created_at_external: e.createdAtExternal ?? null,
      updated_at_external: e.updatedAtExternal ?? null,
      metadata: e.metadata,
    };
    const { error: upErr } = await deps.supabase
      .from('entities')
      .upsert(row, { onConflict: 'workspace_id,source_kind,external_id' });
    if (upErr) {
      errors.push(`upsert ${e.externalId}: ${upErr.message}`);
    } else {
      summary.upserted++;
    }
  }

  if (deps.openrouter) {
    const { data: rows } = await deps.supabase
      .from('entities')
      .select('id,title,body')
      .eq('workspace_id', deps.workspaceId)
      .is('embedding', null)
      .limit(100);
    if (rows && rows.length > 0) {
      const inputs = rows.map(r => `${r.title ?? ''}\n${(r.body ?? '').slice(0, 4000)}`);
      try {
        const embedOpts: { model?: string } = {};
        if (deps.embedModel) embedOpts.model = deps.embedModel;
        const vectors = await deps.openrouter.embed(inputs, embedOpts);
        for (let i = 0; i < rows.length; i++) {
          const id = rows[i]!.id as string;
          const vec = vectors[i];
          if (!vec) continue;
          const { error: embErr } = await deps.supabase
            .from('entities')
            .update({ embedding: vec as unknown as string })
            .eq('id', id);
          if (!embErr) summary.embedded++;
        }
      } catch (err) {
        errors.push(`embed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  const status = errors.length === 0 ? 'success' : (summary.upserted > 0 ? 'partial' : 'failed');
  if (runRow?.id) {
    await deps.supabase
      .from('sync_runs')
      .update({ status, entities_count: summary.upserted, error: errors.slice(0, 5).join(' | ') || null, finished_at: new Date().toISOString() })
      .eq('id', runRow.id);
  }
  await deps.supabase
    .from('sources')
    .update({
      status,
      last_sync_at: new Date().toISOString(),
      last_sync_count: summary.upserted,
      last_error: errors.slice(0, 3).join(' | ') || null,
    })
    .eq('id', sourceId);

  return summary;
}
