'use server';
import { revalidatePath } from 'next/cache';
import { getSupabase, requireWorkspaceId } from '../lib/clients';

export interface ApprovalRow {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  risk: string;
  status: string;
  proposer: string;
  createdAt: string;
}

export async function listPendingApprovals(): Promise<ApprovalRow[]> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return [];
  const { data } = await supabase
    .from('approvals')
    .select('id,kind,payload,risk,status,proposer,created_at')
    .eq('workspace_id', wsId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(r => ({
    id: r.id as string,
    kind: r.kind as string,
    payload: (r.payload as Record<string, unknown>) ?? {},
    risk: (r.risk as string) ?? 'L2',
    status: (r.status as string) ?? 'pending',
    proposer: (r.proposer as string) ?? 'tom',
    createdAt: (r.created_at as string) ?? '',
  }));
}

export async function decideApproval(approvalId: string, decision: 'approved' | 'rejected'): Promise<{ ok: boolean }> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return { ok: false };
  const { error } = await supabase.from('approvals')
    .update({ status: decision, decision, decided_at: new Date().toISOString() })
    .eq('id', approvalId)
    .eq('workspace_id', wsId);
  revalidatePath('/app/approvals');
  revalidatePath('/app');
  return { ok: !error };
}

export async function createApproval(opts: {
  kind: string;
  payload: Record<string, unknown>;
  risk?: string;
  proposer?: string;
}): Promise<{ ok: boolean; id?: string }> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return { ok: false };
  const { data, error } = await supabase.from('approvals').insert({
    workspace_id: wsId,
    kind: opts.kind,
    payload: opts.payload,
    risk: opts.risk ?? 'L2',
    proposer: opts.proposer ?? 'tom',
    status: 'pending',
  }).select('id').single();
  revalidatePath('/app/approvals');
  const result: { ok: boolean; id?: string } = { ok: !error };
  if (data?.id) result.id = data.id as string;
  return result;
}
