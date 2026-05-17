import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineAgent } from '../agent.js';

const baseShape = {
  description: 'desc',
  inputs: z.object({ message: z.string() }),
  outputs: z.object({ reply: z.string() }),
  promptRef: { id: 'inline:test', body: 'hello {{ message }}', variables: ['message'] },
  model: 'mock-model',
  tools: [] as readonly string[],
  autonomy: { default: 'draft_confirm' as const, max: 'auto_with_veto' as const },
  version: 1,
};

describe('defineAgent', () => {
  it('accepts a well-formed team agent', () => {
    const a = defineAgent({
      key: 'tim',
      kind: 'team',
      requiresBoundary: false,
      ...baseShape,
    });
    expect(a.key).toBe('tim');
  });

  it('accepts Tom with requiresBoundary=true', () => {
    const tom = defineAgent({
      key: 'tom',
      kind: 'boundary',
      requiresBoundary: true,
      ...baseShape,
    });
    expect(tom.requiresBoundary).toBe(true);
  });

  it('rejects non-Tom agents that set requiresBoundary=true', () => {
    expect(() =>
      defineAgent({
        key: 'tim',
        kind: 'team',
        requiresBoundary: true,
        ...baseShape,
      }),
    ).toThrow(/Only Tom/);
  });

  it('rejects invalid keys', () => {
    expect(() =>
      defineAgent({
        key: 'INVALID KEY!',
        kind: 'team',
        requiresBoundary: false,
        ...baseShape,
      }),
    ).toThrow(/invalid/i);
  });

  it('rejects non-integer or non-positive versions', () => {
    expect(() =>
      defineAgent({
        key: 'broken',
        kind: 'team',
        requiresBoundary: false,
        ...baseShape,
        version: 0,
      }),
    ).toThrow(/version/);
  });

  it('rejects missing Zod schemas', () => {
    expect(() =>
      defineAgent({
        key: 'broken',
        kind: 'team',
        requiresBoundary: false,
        ...baseShape,
        inputs: undefined as unknown as z.ZodTypeAny,
      }),
    ).toThrow(/inputs/);
  });
});
