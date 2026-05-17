/**
 * Tests for AnswerEngine — full pipeline with mocks.
 */

import { describe, expect, it, vi } from 'vitest';
import { AnswerEngine } from '../answer-engine.js';
import type { HybridSearch } from '../hybrid.js';
import type { HybridResult, Logger, ModelProvider } from '../types.js';

const logger: Logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

function makeHybrid(results: HybridResult[]): HybridSearch {
  return {
    search: vi.fn().mockResolvedValue(results),
  } as unknown as HybridSearch;
}

function makeModel(
  text: string,
  opts: Partial<{ tokensIn: number; tokensOut: number; costCents: number }> = {},
): ModelProvider {
  return {
    name: 'mock',
    send: vi.fn().mockResolvedValue({
      text,
      tokensIn: opts.tokensIn ?? 100,
      tokensOut: opts.tokensOut ?? 50,
      costCents: opts.costCents ?? 1,
      model: 'mock',
      finishReason: 'stop',
    }),
  };
}

describe('AnswerEngine', () => {
  it('returns a graceful empty response when no sources are found', async () => {
    const hybrid = makeHybrid([]);
    const model = makeModel('unused');
    const engine = new AnswerEngine({ hybrid, modelProvider: model, logger });
    const res = await engine.answer({
      workspaceId: 'ws-1',
      query: 'no matches',
      queryVector: [0.1],
    });

    expect(res.answer).toMatch(/not have enough information/i);
    expect(res.citations).toEqual([]);
    expect(res.confidence).toBe(0);
    expect(res.sources).toEqual([]);
    expect(model.send).not.toHaveBeenCalled();
  });

  it('synthesizes an answer and extracts citations', async () => {
    const hybrid = makeHybrid([
      {
        id: 's1',
        layer: 'l1',
        score: 0.9,
        data: { body: 'Q3 revenue dropped because Acme delayed onboarding.' },
      },
      {
        id: 's2',
        layer: 'l1',
        score: 0.8,
        data: { body: 'Acme onboarding is now scheduled for Q4.' },
      },
    ]);
    const model = makeModel(
      'Revenue dropped because Acme delayed onboarding [1]. Recovery is expected in Q4 [2].\nCONFIDENCE: 0.82',
    );
    const engine = new AnswerEngine({ hybrid, modelProvider: model, logger });

    const res = await engine.answer({
      workspaceId: 'ws-1',
      query: 'Why did Q3 revenue drop?',
      queryVector: [0.1, 0.2, 0.3],
    });

    expect(res.answer).not.toMatch(/CONFIDENCE/);
    expect(res.answer).toMatch(/\[1\]/);
    expect(res.confidence).toBeCloseTo(0.82, 2);
    expect(res.citations.length).toBe(2);
    expect(res.citations[0]?.sourceId).toBe('s1');
    expect(res.citations[0]?.sourceLayer).toBe('l1');
    expect(res.citations[1]?.sourceId).toBe('s2');
    expect(res.tokens.in).toBe(100);
    expect(res.tokens.out).toBe(50);
    expect(res.costCents).toBe(1);
  });

  it('embeds the query when no queryVector is supplied', async () => {
    const hybrid = makeHybrid([{ id: 's1', layer: 'l1', score: 0.7, data: { body: 'doc body' } }]);
    const model = makeModel('Answer [1].\nCONFIDENCE: 0.6');
    const embed = vi.fn().mockResolvedValue([new Float32Array([0.1, 0.2, 0.3])]);
    const engine = new AnswerEngine({
      hybrid,
      modelProvider: model,
      logger,
      embeddingProvider: { embed },
    });

    await engine.answer({ workspaceId: 'ws-1', query: 'hello' });
    expect(embed).toHaveBeenCalledWith(['hello']);
  });

  it('throws when no queryVector and no embeddingProvider are available', async () => {
    const hybrid = makeHybrid([{ id: 's1', layer: 'l1', score: 1, data: { body: 'b' } }]);
    const model = makeModel('Answer.\nCONFIDENCE: 0.5');
    const engine = new AnswerEngine({ hybrid, modelProvider: model, logger });
    await expect(engine.answer({ workspaceId: 'ws-1', query: 'hello' })).rejects.toThrow(
      /queryVector/,
    );
  });

  it('ignores out-of-range citation markers', async () => {
    const hybrid = makeHybrid([{ id: 's1', layer: 'l1', score: 1, data: { body: 'b' } }]);
    const model = makeModel('Citing [9] should be dropped, [1] kept.\nCONFIDENCE: 0.9');
    const engine = new AnswerEngine({ hybrid, modelProvider: model, logger });
    const res = await engine.answer({ workspaceId: 'ws-1', query: 'q', queryVector: [0.1] });
    expect(res.citations.length).toBe(1);
    expect(res.citations[0]?.sourceId).toBe('s1');
  });

  it('defaults confidence to 0.5 when the model omits it', async () => {
    const hybrid = makeHybrid([{ id: 's1', layer: 'l1', score: 1, data: { body: 'b' } }]);
    const model = makeModel('No confidence here.');
    const engine = new AnswerEngine({ hybrid, modelProvider: model, logger });
    const res = await engine.answer({ workspaceId: 'ws-1', query: 'q', queryVector: [0.1] });
    expect(res.confidence).toBe(0.5);
  });

  it('passes context blocks with [N] markers to the model', async () => {
    const hybrid = makeHybrid([
      { id: 's1', layer: 'l1', score: 0.9, data: { body: 'Alpha info.' } },
      { id: 's2', layer: 'l1', score: 0.8, data: { body: 'Beta info.' } },
    ]);
    const model = makeModel('Answer [1] [2].\nCONFIDENCE: 0.7');
    const engine = new AnswerEngine({ hybrid, modelProvider: model, logger });
    await engine.answer({ workspaceId: 'ws-1', query: 'q', queryVector: [0.1] });

    const sendArgs = (model.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      messages: { content: string }[];
    };
    expect(sendArgs.messages[0]?.content).toContain('[1]');
    expect(sendArgs.messages[0]?.content).toContain('[2]');
    expect(sendArgs.messages[0]?.content).toContain('Alpha info');
    expect(sendArgs.messages[0]?.content).toContain('Beta info');
  });

  it('honors maxSources by passing it through to hybrid.search', async () => {
    const hybridSearchSpy = vi.fn().mockResolvedValue([]);
    const hybrid = { search: hybridSearchSpy } as unknown as HybridSearch;
    const model = makeModel('x');
    const engine = new AnswerEngine({ hybrid, modelProvider: model, logger });
    await engine.answer({ workspaceId: 'ws-1', query: 'q', queryVector: [0.1], maxSources: 3 });
    expect(hybridSearchSpy).toHaveBeenCalledWith('ws-1', 'q', [0.1], { limit: 3 });
  });
});
