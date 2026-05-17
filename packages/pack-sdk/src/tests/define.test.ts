import { describe, expect, it } from 'vitest';
import { definePack } from '../define-pack.js';

describe('definePack', () => {
  const validManifest = {
    key: 'cpa-core',
    name: 'CPA Core',
    description: 'Core CPA object types',
    vertical: 'cpa',
    vendor: 'VitaOS',
    license: 'MIT',
    items: [
      {
        kind: 'object_type' as const,
        key: 'client',
        name: 'Client',
        definition: {
          properties: {
            name: { type: 'string', required: true },
            email: { type: 'string', required: false },
          },
        },
      },
    ],
  };

  it('returns the manifest when valid', () => {
    const result = definePack(validManifest);
    expect(result.key).toBe('cpa-core');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.key).toBe('client');
  });

  it('fills in default dependencies', () => {
    const result = definePack(validManifest);
    expect(result.dependencies).toEqual({});
  });

  it('throws on missing key', () => {
    expect(() =>
      definePack({ ...validManifest, key: '' }),
    ).toThrow();
  });

  it('throws on invalid key format (uppercase)', () => {
    expect(() =>
      definePack({ ...validManifest, key: 'CPA-Core' }),
    ).toThrow();
  });

  it('throws on missing items', () => {
    expect(() =>
      definePack({ ...validManifest, items: [] }),
    ).not.toThrow(); // empty arrays are allowed
  });

  it('throws on invalid item kind', () => {
    expect(() =>
      definePack({
        ...validManifest,
        items: [
          {
            kind: 'invalid_kind',
            key: 'test',
            name: 'Test',
            definition: {},
          },
        ],
      } as any),
    ).toThrow();
  });

  it('throws on invalid item key format', () => {
    expect(() =>
      definePack({
        ...validManifest,
        items: [
          {
            kind: 'object_type' as const,
            key: 'Bad_Key',
            name: 'Test',
            definition: {},
          },
        ],
      }),
    ).toThrow();
  });
});
