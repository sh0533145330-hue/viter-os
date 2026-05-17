import { describe, expect, it, beforeEach } from 'vitest';
import { VocabularyResolver } from '../vocabulary.js';
import type { LabelOverride } from '../types.js';

describe('VocabularyResolver', () => {
  let resolver: VocabularyResolver;

  beforeEach(() => {
    resolver = new VocabularyResolver();
  });

  it('returns undefined for unregistered key', () => {
    const result = resolver.resolve('nonexistent', 'en-US');
    expect(result).toBeUndefined();
  });

  it('returns fallback when no override', () => {
    const label = resolver.labelSingular('client', 'Client', 'en-US');
    expect(label).toBe('Client');
  });

  it('returns override for registered key', () => {
    const overrides: LabelOverride[] = [
      {
        key: 'client',
        labelSingular: 'Taxpayer',
        labelPlural: 'Taxpayers',
        locale: 'en-US',
      },
    ];

    resolver.addOverrides(overrides);

    expect(resolver.labelSingular('client', 'Client')).toBe('Taxpayer');
    expect(resolver.labelPlural('client', 'Clients')).toBe('Taxpayers');
  });

  it('handles multiple locales', () => {
    const overrides: LabelOverride[] = [
      { key: 'invoice', labelSingular: 'Invoice', locale: 'en-US' },
      { key: 'invoice', labelSingular: 'Facture', locale: 'fr-FR' },
    ];

    resolver.addOverrides(overrides);

    expect(resolver.labelSingular('invoice', 'Invoice', 'en-US')).toBe(
      'Invoice',
    );
    expect(resolver.labelSingular('invoice', 'Invoice', 'fr-FR')).toBe(
      'Facture',
    );
  });

  it('second add appends (does not erase) first overrides', () => {
    resolver.addOverrides([
      { key: 'a', labelSingular: 'First', locale: 'en-US' },
    ]);
    resolver.addOverrides([
      { key: 'b', labelSingular: 'Second', locale: 'en-US' },
    ]);

    expect(resolver.labelSingular('a', 'default')).toBe('First');
    expect(resolver.labelSingular('b', 'default')).toBe('Second');
  });

  it('clear removes all overrides', () => {
    resolver.addOverrides([
      { key: 'test', labelSingular: 'Override', locale: 'en-US' },
    ]);
    expect(resolver.size).toBe(1);

    resolver.clear();
    expect(resolver.size).toBe(0);
    expect(resolver.resolve('test', 'en-US')).toBeUndefined();
  });

  it('size reflects number of entries across locales', () => {
    resolver.addOverrides([
      { key: 'a', labelSingular: 'A', locale: 'en-US' },
      { key: 'a', labelSingular: 'A-fr', locale: 'fr-FR' },
      { key: 'b', labelSingular: 'B', locale: 'en-US' },
    ]);
    expect(resolver.size).toBe(3);
  });
});
