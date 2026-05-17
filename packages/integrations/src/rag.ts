import type { SupabaseClient } from '@supabase/supabase-js';
import type { OpenRouterClient } from './openrouter.js';

export interface RagCitation {
  id: string;
  title: string;
  url?: string;
  sourceKind: string;
  type: string;
  snippet: string;
  score: number;
}

export interface RagContext {
  query: string;
  citations: RagCitation[];
  systemPrompt: string;
  userPrompt: string;
}

export async function buildRagContext(
  supabase: SupabaseClient,
  openrouter: OpenRouterClient,
  workspaceId: string,
  query: string,
  opts: { k?: number; sourceFilter?: string; typeFilter?: string; agentName?: string } = {},
): Promise<RagContext> {
  const k = opts.k ?? 8;
  const agentName = opts.agentName ?? 'Tom';

  let citations: RagCitation[] = [];
  try {
    const [qEmbedding] = await openrouter.embed(query);
    const { data, error } = await supabase.rpc('vita_hybrid_search', {
      ws: workspaceId,
      q: query,
      q_embedding: qEmbedding as unknown as string,
      source_filter: opts.sourceFilter ?? null,
      type_filter: opts.typeFilter ?? null,
      k,
    });
    if (!error && Array.isArray(data)) {
      citations = (data as Array<{ id: string; title: string; body: string; source_kind: string; type: string; url?: string; hybrid_score: number }>).map(d => {
        const c: RagCitation = {
          id: d.id,
          title: d.title ?? '(untitled)',
          sourceKind: d.source_kind,
          type: d.type,
          snippet: (d.body ?? '').slice(0, 400),
          score: d.hybrid_score,
        };
        if (d.url) c.url = d.url;
        return c;
      });
    }
  } catch {
    // fall through to FTS-only
  }

  if (citations.length === 0) {
    const { data } = await supabase
      .from('entities')
      .select('id,title,body,source_kind,type,url')
      .eq('workspace_id', workspaceId)
      .textSearch('ts_doc', query, { type: 'websearch' })
      .limit(k);
    if (data) {
      citations = data.map((d) => {
        const c: RagCitation = {
          id: d.id as string,
          title: (d.title as string) ?? '(untitled)',
          sourceKind: d.source_kind as string,
          type: d.type as string,
          snippet: ((d.body as string | null) ?? '').slice(0, 400),
          score: 0,
        };
        const url = d.url as string | null;
        if (url) c.url = url;
        return c;
      });
    }
  }

  const contextBlock = citations.length === 0
    ? '(no relevant context found in the workspace)'
    : citations.map((c, i) => `[${i + 1}] ${c.title} — ${c.sourceKind}/${c.type}\n${c.snippet}`).join('\n\n');

  const systemPrompt = [
    `You are ${agentName}, a personal co-pilot inside VitaOS — a 360° context engine over the user's connected systems.`,
    `Answer the user's question using the WORKSPACE CONTEXT below. Cite sources inline as [1], [2], etc., matching the numbered context blocks. If context is insufficient, say so plainly.`,
    `Be concise. Editorial tone. No corporate fluff.`,
  ].join('\n');

  const userPrompt = `WORKSPACE CONTEXT:\n${contextBlock}\n\nQUESTION:\n${query}`;

  return { query, citations, systemPrompt, userPrompt };
}
