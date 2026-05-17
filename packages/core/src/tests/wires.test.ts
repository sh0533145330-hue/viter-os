import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineBlock } from '../block.js';
import { WireTypeError } from '../errors.js';
import { compareSchemas, validateWires } from '../wires.js';

describe('compareSchemas', () => {
  it('returns exact for identical instance', () => {
    const s = z.string();
    expect(compareSchemas(s, s)).toBe('exact');
  });

  it('returns structural for compatible objects', () => {
    const a = z.object({ x: z.number(), extra: z.string() });
    const b = z.object({ x: z.number() });
    expect(compareSchemas(a, b)).toBe('structural');
  });

  it('returns incompatible for mismatched primitives', () => {
    expect(compareSchemas(z.string(), z.number())).toBe('incompatible');
  });

  it('returns incompatible when required consumer key missing on producer', () => {
    const a = z.object({ x: z.number() });
    const b = z.object({ y: z.number() });
    expect(compareSchemas(a, b)).toBe('incompatible');
  });

  it('treats consumer ZodAny as a wildcard', () => {
    expect(compareSchemas(z.string(), z.any())).toBe('structural');
  });
});

describe('validateWires', () => {
  const producer = defineBlock({
    key: 'prod',
    category: 'utility',
    inputs: z.any(),
    outputs: z.object({ name: z.string() }),
    idempotent: false,
    handler: async () => ({ name: 'x' }),
  });
  const consumer = defineBlock({
    key: 'cons',
    category: 'utility',
    inputs: z.object({ name: z.string() }),
    outputs: z.any(),
    idempotent: false,
    handler: async () => ({}),
  });

  it('accepts compatible wires', () => {
    expect(() =>
      validateWires(
        [
          { id: 'p', block: producer },
          { id: 'c', block: consumer },
        ],
        [{ from: { blockId: 'p', port: 'name' }, to: { blockId: 'c', port: 'name' } }],
      ),
    ).not.toThrow();
  });

  it('throws when producer is unknown', () => {
    expect(() =>
      validateWires(
        [{ id: 'c', block: consumer }],
        [{ from: { blockId: 'p', port: 'name' }, to: { blockId: 'c', port: 'name' } }],
      ),
    ).toThrow(WireTypeError);
  });

  it('throws on incompatible schemas', () => {
    const numberProducer = defineBlock({
      key: 'prod.num',
      category: 'utility',
      inputs: z.any(),
      outputs: z.object({ name: z.number() }),
      idempotent: false,
      handler: async () => ({ name: 1 }),
    });
    expect(() =>
      validateWires(
        [
          { id: 'p', block: numberProducer },
          { id: 'c', block: consumer },
        ],
        [{ from: { blockId: 'p', port: 'name' }, to: { blockId: 'c', port: 'name' } }],
      ),
    ).toThrow(WireTypeError);
  });
});
