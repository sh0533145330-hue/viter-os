import { describe, expect, it } from 'vitest';
import { defaultPolicy, modelCatalog } from '../engine.js';

describe('engine policy', () => {
  it('returns Sonnet by default', () => {
    const choice = defaultPolicy().choose({ agentKey: 'agent.tom' });
    expect(choice.provider).toBe('anthropic');
    expect(choice.model).toContain('sonnet');
  });

  it('returns Haiku when budget is low', () => {
    const choice = defaultPolicy().choose({
      agentKey: 'agent.tom',
      budgetRemainingCents: 10,
    });
    expect(choice.model).toContain('haiku');
  });

  it('honours oss hint', () => {
    const choice = defaultPolicy().choose({ agentKey: 'agent.x', hint: 'oss' });
    expect(choice.provider).toBe('together');
  });

  it('catalog snapshot contains canonical entries', () => {
    const catalog = modelCatalog();
    expect(Object.keys(catalog)).toEqual(
      expect.arrayContaining(['claude-sonnet', 'claude-haiku', 'gpt-4o', 'together-llama']),
    );
  });
});
