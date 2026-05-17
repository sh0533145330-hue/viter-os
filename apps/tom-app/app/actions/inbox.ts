'use server';
import { readWorkspace } from '../lib/workspace';
import { createClient } from '@supabase/supabase-js';

export interface InboxMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  createdAt: string;
}

export async function getInboxMessages(limit = 20): Promise<InboxMessage[]> {
  const w = await readWorkspace();
  if (!w.supabase?.url || !w.supabase?.serviceRoleKey) return [];
  const supabase = createClient(w.supabase.url, w.supabase.serviceRoleKey);
  const { data } = await supabase
    .from('messages')
    .select('id, role, content, model, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (!data) return [];
  return data.map((m: { id: string; role: string; content: string | null; model: string | null; created_at: string | null }) => {
    const msg: InboxMessage = { id: m.id, role: m.role === 'user' ? 'user' : 'assistant', content: m.content ?? '', createdAt: m.created_at ?? new Date().toISOString() };
    if (m.model) msg.model = m.model;
    return msg;
  });
}

export interface PendingApproval {
  id: string;
  kind: string;
  risk: 'L1' | 'L2' | 'L3' | 'L4';
  proposer: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export async function getPendingApprovals(): Promise<PendingApproval[]> {
  const w = await readWorkspace();
  if (!w.supabase?.url || !w.supabase?.serviceRoleKey) return [];
  const supabase = createClient(w.supabase.url, w.supabase.serviceRoleKey);
  const { data } = await supabase
    .from('approvals')
    .select('id, kind, risk, proposer, payload, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);
  if (!data) return [];
  return data.map((a: { id: string; kind: string | null; risk: string | null; proposer: string | null; payload: unknown; created_at: string | null }) => ({
    id: a.id,
    kind: a.kind ?? '',
    risk: (a.risk ?? 'L2') as PendingApproval['risk'],
    proposer: a.proposer ?? '',
    payload: (a.payload ?? {}) as Record<string, unknown>,
    createdAt: a.created_at ?? new Date().toISOString(),
  }));
}

export async function decideApproval(approvalId: string, decision: 'approved' | 'rejected'): Promise<{ ok: boolean }> {
  const w = await readWorkspace();
  if (!w.supabase?.url || !w.supabase?.serviceRoleKey) return { ok: false };
  const supabase = createClient(w.supabase.url, w.supabase.serviceRoleKey);
  const { error } = await supabase.from('approvals').update({ status: decision, decided_at: new Date().toISOString() }).eq('id', approvalId);
  return { ok: !error };
}
