'use server';
import { getSupabase, requireWorkspaceId } from '../lib/clients';
import { readWorkspace } from '../lib/workspace-store';

export interface DashboardCounts {
  entities: number;
  sources: number;
  pendingApprovals: number;
  messages: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  const zero = { entities: 0, sources: 0, pendingApprovals: 0, messages: 0 };
  if (!supabase || !wsId) return zero;
  const [entities, sources, approvals, messages] = await Promise.all([
    supabase.from('entities').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId),
    supabase.from('sources').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId),
    supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('status', 'pending'),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId),
  ]);
  return {
    entities: entities.count ?? 0,
    sources: sources.count ?? 0,
    pendingApprovals: approvals.count ?? 0,
    messages: messages.count ?? 0,
  };
}

export async function getRecentMessages(): Promise<Array<{ id: string; role: string; content: string; createdAt: string; model?: string }>> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return [];
  const { data } = await supabase.from('messages')
    .select('id,role,content,created_at,model')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (!data) return [];
  return data.map(r => {
    const row: { id: string; role: string; content: string; createdAt: string; model?: string } = {
      id: r.id as string,
      role: r.role as string,
      content: r.content as string,
      createdAt: r.created_at as string,
    };
    if (r.model) row.model = r.model as string;
    return row;
  });
}

export async function getWorkspaceInfo(): Promise<{ name: string; tomName: string; timName: string; onboarded: boolean }> {
  const w = await readWorkspace();
  return {
    name: w.workspaceName ?? '',
    tomName: w.tomName ?? 'Tom',
    timName: w.timName ?? 'Tim',
    onboarded: Boolean(w.supabase && w.openrouter && w.workspaceId),
  };
}
