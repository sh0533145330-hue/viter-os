import { describe, expect, it } from 'vitest';
import { applyOverlay, applyPackOverlays } from '../overlay.js';

describe('applyOverlay', () => {
  it('returns base when no overlays provided', () => {
    const base = { a: 1, b: 'hello' };
    const result = applyOverlay(base, []);
    expect(result).toEqual({ a: 1, b: 'hello' });
    // Must be a shallow copy, not the same reference
    expect(result).not.toBe(base);
  });

  it('overrides top-level scalar fields', () => {
    const base = { name: 'original', count: 42 };
    const overlays = [{ name: 'overridden' }];
    const result = applyOverlay(base, overlays);
    expect(result.name).toBe('overridden');
    expect(result.count).toBe(42);
  });

  it('merges nested objects', () => {
    const base = {
      properties: {
        name: { type: 'string', required: true },
        email: { type: 'string', required: false },
      },
    };
    const overlays = [
      {
        properties: {
          email: { type: 'string', required: true },
        },
      },
    ];
    const result = applyOverlay(base, overlays);
    const props = result.properties as Record<string, Record<string, unknown>>;
    expect(props['name']).toBeDefined();
    expect(props['name']!['required']).toBe(true);
    expect(props['email']!['required']).toBe(true); // overridden
  });

  it('applies multiple overlays in order', () => {
    const base = { value: 0 };
    const overlays = [{ value: 1 }, { value: 2 }, { value: 3 }];
    const result = applyOverlay(base, overlays);
    expect(result.value).toBe(3);
  });

  it('replaces arrays instead of merging', () => {
    const base = { tags: ['a', 'b'] };
    const overlays = [{ tags: ['c', 'd'] }];
    const result = applyOverlay(base, overlays);
    expect(result.tags).toEqual(['c', 'd']);
  });

  it('adds new keys from overlay', () => {
    const base = { a: 1 };
    const overlays = [{ b: 2 }];
    const result = applyOverlay(base, overlays);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('deep merges vocabulary objects', () => {
    const base = {
      vocabulary: { client: 'Client', engagement: 'Engagement' },
    };
    const overlays = [
      {
        vocabulary: { client: 'Taxpayer' },
      },
    ];
    const result = applyOverlay(base, overlays);
    const vocab = result.vocabulary as Record<string, string>;
    expect(vocab['client']).toBe('Taxpayer');
    expect(vocab['engagement']).toBe('Engagement');
  });
});

describe('applyPackOverlays', () => {
  it('applies overlays in priority order', () => {
    const base = { label: 'base' };
    const overlays = [
      { overlay: { label: 'low' }, priority: 10 },
      { overlay: { label: 'high' }, priority: 1 },
    ];

    const result = applyPackOverlays(base, overlays);
    expect(result.label).toBe('high'); // priority 1 applied second
  });
});
