import { describe, expect, it } from 'vitest';
import { defaultBrandIdentity } from '../identity.js';
import { LegalLinkResolver, platformLegalLinks } from '../legal.js';

describe('LegalLinkResolver', () => {
  it('returns brand link when configured', () => {
    const resolver = new LegalLinkResolver();
    const url = resolver.resolve(
      { ...defaultBrandIdentity(), legalLinks: { tos: 'https://acme.com/tos' } },
      'tos',
    );
    expect(url).toBe('https://acme.com/tos');
  });

  it('falls back to platform link when brand missing', () => {
    const resolver = new LegalLinkResolver();
    expect(resolver.resolve(defaultBrandIdentity(), 'tos')).toBe(platformLegalLinks().tos);
  });

  it('respects platform overrides', () => {
    const resolver = new LegalLinkResolver({ tos: 'https://example.com/tos' });
    expect(resolver.resolve(defaultBrandIdentity(), 'tos')).toBe('https://example.com/tos');
  });

  it('resolveAll returns every link', () => {
    const resolver = new LegalLinkResolver();
    const all = resolver.resolveAll(defaultBrandIdentity());
    expect(all.tos).toBeTruthy();
    expect(all.privacy).toBeTruthy();
    expect(all.dpa).toBeTruthy();
  });

  it('poweredByLabel marks white-label brands', () => {
    const resolver = new LegalLinkResolver();
    expect(
      resolver.poweredByLabel({
        ...defaultBrandIdentity(),
        scope: 'workspace',
        displayName: 'Acme',
      }),
    ).toBe('Acme · Powered by VitaOS');
  });

  it('poweredByLabel omits powered-by for platform scope', () => {
    const resolver = new LegalLinkResolver();
    expect(resolver.poweredByLabel(defaultBrandIdentity())).toBe('© VitaOS');
  });
});
