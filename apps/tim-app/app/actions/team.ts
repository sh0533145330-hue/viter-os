'use server';
import { readWorkspace } from '../lib/workspace';
import { createClient } from '@supabase/supabase-js';

export interface TeamStats {
  entityCount: number;
  messageCount: number;
  pendingApprovals: number;
  sourceCount: number;
}

export async function getTeamStats(): Promise<TeamStats> {
  const w = await readWorkspace();
  if (!w.supabase?.url || !w.supabase?.serviceRoleKey) {
    return { entityCount: 0, messageCount: 0, pendingApprovals: 0, sourceCount: 0 };
  }
  const supabase = createClient(w.supabase.url, w.supabase.serviceRoleKey);
  const [e, m, a, s] = await Promise.all([
    supabase.from('entities').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }),
    supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('sources').select('id', { count: 'exact', head: true }),
  ]);
  return { entityCount: e.count ?? 0, messageCount: m.count ?? 0, pendingApprovals: a.count ?? 0, sourceCount: s.count ?? 0 };
}

export interface OKR {
  id: string;
  title: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'off_track';
  owner?: string;
}

export async function getOKRs(): Promise<OKR[]> {
  // OKRs are stored as entities of type 'okr' — query the ontology
  const w = await readWorkspace();
  if (!w.supabase?.url || !w.supabase?.serviceRoleKey) return [];
  const supabase = createClient(w.supabase.url, w.supabase.serviceRoleKey);
  const { data } = await supabase
    .from('entities')
    .select('id, title, properties')
    .eq('type', 'okr')
    .order('created_at', { ascending: false })
    .limit(20);
  if (!data) return [];
  return data.map((r: { id: string; title: string; properties: Record<string, unknown> | null }) => {
    const p = r.properties ?? {};
    const okr: OKR = {
      id: r.id,
      title: r.title,
      progress: typeof p['progress'] === 'number' ? p['progress'] : 0,
      status: (p['status'] as OKR['status'] | undefined) ?? 'on_track',
    };
    if (typeof p['owner'] === 'string') okr.owner = p['owner'];
    return okr;
  });
}
