'use server';
import { getSupabase, requireWorkspaceId } from '../lib/clients';

export interface EntityTypeStat {
  type: string;
  sourceKind: string;
  count: number;
  embedded: number;
}

export async function getEntityStats(): Promise<EntityTypeStat[]> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return [];
  const { data } = await supabase
    .from('entities')
    .select('type,source_kind,embedding')
    .eq('workspace_id', wsId);
  if (!data) return [];
  const map = new Map<string, { count: number; embedded: number }>();
  for (const row of data) {
    const key = `${row.type as string}||${row.source_kind as string}`;
    const cur = map.get(key) ?? { count: 0, embedded: 0 };
    cur.count++;
    if (row.embedding) cur.embedded++;
    map.set(key, cur);
  }
  return Array.from(map.entries()).map(([key, val]) => {
    const [type, sourceKind] = key.split('||');
    return { type: type ?? '', sourceKind: sourceKind ?? '', count: val.count, embedded: val.embedded };
  }).sort((a, b) => b.count - a.count);
}

export interface EntityRow {
  id: string;
  type: string;
  sourceKind: string;
  title: string;
  url?: string;
  updatedAt?: string;
}

export async function listEntities(opts: { type?: string; sourceKind?: string; limit?: number; search?: string }): Promise<EntityRow[]> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return [];
  let q = supabase.from('entities')
    .select('id,type,source_kind,title,url,updated_at_external')
    .eq('workspace_id', wsId)
    .order('ingested_at', { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.type) q = q.eq('type', opts.type);
  if (opts.sourceKind) q = q.eq('source_kind', opts.sourceKind);
  if (opts.search) q = q.ilike('title', `%${opts.search}%`);
  const { data } = await q;
  if (!data) return [];
  return data.map(r => {
    const row: EntityRow = {
      id: r.id as string,
      type: r.type as string,
      sourceKind: r.source_kind as string,
      title: (r.title as string | null) ?? '(untitled)',
    };
    if (r.url) row.url = r.url as string;
    if (r.updated_at_external) row.updatedAt = r.updated_at_external as string;
    return row;
  });
}
