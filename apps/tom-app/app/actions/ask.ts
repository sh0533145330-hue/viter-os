'use server';
import { readWorkspace } from '../lib/workspace';
import { OpenRouterClient } from '@vita/integrations';
import { createClient } from '@supabase/supabase-js';

export interface AskResult {
  answer: string;
  citations: Array<{ id: string; title: string; url?: string }>;
  model?: string;
  error?: string;
}

export async function askTom(question: string): Promise<AskResult> {
  const w = await readWorkspace();
  if (!w.supabase?.url || !w.supabase?.serviceRoleKey || !w.openrouter?.apiKey) {
    return { answer: '', citations: [], error: 'VitaOS not configured — run setup on the operator app first.' };
  }

  const supabase = createClient(w.supabase.url, w.supabase.serviceRoleKey);
  const or = new OpenRouterClient({ apiKey: w.openrouter.apiKey });
  const wsId = w.workspaceId;

  const contextChunks: string[] = [];
  const citations: AskResult['citations'] = [];

  try {
    const embeddings = await or.embed(question, { model: w.openrouter.embeddingModel });
    const embedding = embeddings[0] ?? [];

    if (embedding.length > 0) {
      const { data: chunks } = await supabase.rpc('match_chunks', {
        query_embedding: embedding,
        match_count: 6,
        workspace_filter: wsId ?? null,
      });

      if (chunks && Array.isArray(chunks)) {
        for (const c of chunks as Array<{ chunk_text: string; entity_id: string; entity_title: string; entity_url?: string }>) {
          contextChunks.push(c.chunk_text);
          if (!citations.find(ct => ct.id === c.entity_id)) {
            const citation: { id: string; title: string; url?: string } = { id: c.entity_id, title: c.entity_title };
            if (c.entity_url) citation.url = c.entity_url;
            citations.push(citation);
          }
        }
      }
    }
  } catch {
    // No embedding available — pure LLM fallback
  }

  const systemPrompt = `You are ${w.tomName ?? 'Tom'}, a highly capable personal AI co-pilot with full context about the user's workspace.${contextChunks.length > 0 ? '\n\nRelevant context:\n' + contextChunks.slice(0, 4).join('\n\n---\n\n') : ''}\n\nBe concise and actionable.`;

  try {
    const model = w.openrouter.defaultModel ?? 'anthropic/claude-3.5-sonnet';
    const result = await or.chat(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }],
      { model, maxTokens: 600 },
    );
    const answer = result.text;
    const ret: AskResult = { answer, citations };
    ret.model = result.model;
    return ret;
  } catch (e) {
    return { answer: '', citations: [], error: e instanceof Error ? e.message : String(e) };
  }
}
