/**
 * AnswerEngine — search → retrieve → LLM-synthesize → cite.
 *
 * Pipeline:
 *   1. Embed query if no `queryVector` is provided.
 *   2. Run hybrid search.
 *   3. Apply personalization, if user prefs are supplied.
 *   4. Build a structured context prompt and call the model.
 *   5. Extract citations as `[N]` markers and map them back to sources.
 */

import type { HybridSearch } from './hybrid.js';
import { personalizeRanking } from './personalization.js';
import type {
  AnswerRequest,
  AnswerResponse,
  Citation,
  EmbeddingProvider,
  HybridResult,
  Logger,
  ModelProvider,
  UserPrefs,
} from './types.js';

const DEFAULT_MAX_SOURCES = 8;
const SYSTEM_PROMPT = [
  'You are an expert research assistant.',
  'Answer the user question strictly from the numbered context blocks below.',
  'Cite each fact with [N] markers referring to the block number.',
  'If the context is insufficient, say "I do not have enough information" and cite nothing.',
  'End your answer with a single line: CONFIDENCE: <value between 0 and 1>.',
].join(' ');

const CITATION_RE = /\[(\d+)\]/g;
const CONFIDENCE_RE = /CONFIDENCE:\s*([0-9]*\.?[0-9]+)/i;

export interface AnswerEngineDeps {
  hybrid: HybridSearch;
  modelProvider: ModelProvider;
  logger: Logger;
  embeddingProvider?: EmbeddingProvider;
  model?: string;
}

function snippet(text: string, max = 240): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function inferLayer(layer: HybridResult['layer']): 'l0' | 'l1' | 'l2' {
  if (layer === 'l0' || layer === 'l1' || layer === 'l2') return layer;
  return 'l1';
}

export class AnswerEngine {
  private readonly hybrid: HybridSearch;
  private readonly modelProvider: ModelProvider;
  private readonly logger: Logger;
  private readonly embeddingProvider: EmbeddingProvider | undefined;
  private readonly model: string;

  constructor(deps: AnswerEngineDeps) {
    this.hybrid = deps.hybrid;
    this.modelProvider = deps.modelProvider;
    this.logger = deps.logger;
    this.embeddingProvider = deps.embeddingProvider;
    this.model = deps.model ?? 'gpt-4o-mini';
  }

  async answer(req: AnswerRequest): Promise<AnswerResponse> {
    const start = Date.now();
    const maxSources = req.maxSources ?? DEFAULT_MAX_SOURCES;

    const queryVector = req.queryVector ?? (await this.embedQuery(req.query));

    let sources = await this.hybrid.search(req.workspaceId, req.query, queryVector, {
      limit: maxSources,
    });

    if (req.userPrefs && Object.keys(req.userPrefs).length > 0) {
      sources = personalizeRanking(sources, req.userPrefs as UserPrefs);
    }

    if (sources.length === 0) {
      return {
        answer: 'I do not have enough information to answer that question.',
        citations: [],
        confidence: 0,
        tokens: { in: 0, out: 0 },
        costCents: 0,
        latencyMs: Date.now() - start,
        sources: [],
      };
    }

    const contextBlocks = sources
      .map((s, i) => {
        const body = typeof s.data.body === 'string' ? (s.data.body as string) : '';
        return `[${i + 1}] (${s.layer}:${s.id})\n${snippet(body, 800)}`;
      })
      .join('\n\n');

    const userMessage = `Question: ${req.query}\n\nContext:\n${contextBlocks}`;
    const modelResponse = await this.modelProvider.send({
      model: this.model,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.2,
      maxTokens: 1024,
    });

    const rawText = modelResponse.text ?? '';
    const confidence = this.parseConfidence(rawText);
    const cleanText = rawText.replace(CONFIDENCE_RE, '').trim();
    const citations = this.extractCitations(cleanText, sources);

    return {
      answer: cleanText,
      citations,
      confidence,
      tokens: { in: modelResponse.tokensIn, out: modelResponse.tokensOut },
      costCents: modelResponse.costCents,
      latencyMs: Date.now() - start,
      sources,
    };
  }

  private async embedQuery(query: string): Promise<number[]> {
    if (!this.embeddingProvider) {
      throw new Error('AnswerEngine: queryVector not provided and no embeddingProvider configured');
    }
    const [vec] = await this.embeddingProvider.embed([query]);
    if (!vec) throw new Error('AnswerEngine: embedding provider returned no vector');
    return Array.from(vec);
  }

  private parseConfidence(text: string): number {
    const match = text.match(CONFIDENCE_RE);
    if (!match || !match[1]) return 0.5;
    const value = Number.parseFloat(match[1]);
    if (Number.isNaN(value)) return 0.5;
    return Math.max(0, Math.min(1, value));
  }

  private extractCitations(text: string, sources: HybridResult[]): Citation[] {
    const seen = new Map<number, Citation>();
    const matches = text.matchAll(CITATION_RE);
    for (const match of matches) {
      const raw = match[1];
      if (!raw) continue;
      const idx = Number.parseInt(raw, 10);
      if (Number.isNaN(idx) || idx < 1 || idx > sources.length) continue;
      if (seen.has(idx)) continue;
      const src = sources[idx - 1];
      if (!src) continue;
      const body = typeof src.data.body === 'string' ? (src.data.body as string) : '';
      const citation: Citation = {
        sourceId: src.id,
        sourceLayer: inferLayer(src.layer),
        relevance: src.score,
      };
      if (body) citation.quote = snippet(body, 240);
      seen.set(idx, citation);
    }
    return Array.from(seen.values());
  }
}
