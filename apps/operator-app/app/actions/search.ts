'use server';
import { buildRagContext } from '@vita/integrations';
import { getSupabase, getOpenRouter, requireWorkspaceId } from '../lib/clients';
import { readWorkspace } from '../lib/workspace-store';
import type { RagCitation } from '@vita/integrations';

export interface AskResult {
  answer: string;
  citations: RagCitation[];
  model: string;
  error?: string;
}

export async function askTom(query: string, opts: { sourceFilter?: string; typeFilter?: string } = {}): Promise<AskResult> {
  const supabase = await getSupabase();
  const openrouter = await getOpenRouter();
  const wsId = await requireWorkspaceId();
  const w = await readWorkspace();
  if (!supabase || !openrouter || !wsId) {
    return { answer: '', citations: [], model: '', error: 'Workspace not fully connected. Complete /welcome first.' };
  }
  try {
    const ragOpts: Parameters<typeof buildRagContext>[4] = { k: 8, agentName: w.tomName ?? 'Tom' };
    if (opts.sourceFilter) ragOpts.sourceFilter = opts.sourceFilter;
    if (opts.typeFilter) ragOpts.typeFilter = opts.typeFilter;
    const ctx = await buildRagContext(supabase, openrouter, wsId, query, ragOpts);
    const completion = await openrouter.chat([
      { role: 'system', content: ctx.systemPrompt },
      { role: 'user', content: ctx.userPrompt },
    ], { temperature: 0.2, maxTokens: 800 });
    await supabase.from('messages').insert([
      { workspace_id: wsId, role: 'user', content: query },
      { workspace_id: wsId, role: 'assistant', content: completion.text, citations: ctx.citations, model: completion.model },
    ]);
    return { answer: completion.text, citations: ctx.citations, model: completion.model };
  } catch (err) {
    return { answer: '', citations: [], model: '', error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listSourceKinds(): Promise<Array<{ kind: string; count: number }>> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return [];
  const { data } = await supabase
    .from('entities')
    .select('source_kind')
    .eq('workspace_id', wsId);
  if (!data) return [];
  const counts = new Map<string, number>();
  for (const row of data) {
    const k = row.source_kind as string;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count);
}

export async function listEntityTypes(): Promise<Array<{ type: string; count: number }>> {
  const supabase = await getSupabase();
  const wsId = await requireWorkspaceId();
  if (!supabase || !wsId) return [];
  const { data } = await supabase
    .from('entities')
    .select('type')
    .eq('workspace_id', wsId);
  if (!data) return [];
  const counts = new Map<string, number>();
  for (const row of data) {
    const t = row.type as string;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}
