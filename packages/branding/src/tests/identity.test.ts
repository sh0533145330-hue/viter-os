import { describe, expect, it } from 'vitest';
import {
  type BrandIdentityRow,
  brandIdentityFromRow,
  defaultBrandIdentity,
  parseBrandIdentity,
  safeParseBrandIdentity,
} from '../identity.js';

describe('defaultBrandIdentity', () => {
  it('returns a fully-populated platform brand', () => {
    const brand = defaultBrandIdentity();
    expect(brand.scope).toBe('platform');
    expect(brand.tomName).toBe('Tom');
    expect(brand.timName).toBe('Tim');
    expect(brand.displayName).toBe('VitaOS');
    expect(brand.themeTokens.colors.primary).toBeDefined();
    expect(brand.enabled).toBe(true);
  });

  it('passes zod validation', () => {
    expect(() => parseBrandIdentity(defaultBrandIdentity())).not.toThrow();
  });
});

describe('safeParseBrandIdentity', () => {
  it('returns ok for a valid brand', () => {
    const result = safeParseBrandIdentity(defaultBrandIdentity());
    expect(result.ok).toBe(true);
  });

  it('returns an error for an invalid brand', () => {
    const result = safeParseBrandIdentity({ id: '', scope: 'unknown' });
    expect(result.ok).toBe(false);
  });
});

describe('brandIdentityFromRow', () => {
  it('coerces a db row into a typed BrandIdentity', () => {
    const row: BrandIdentityRow = {
      id: 'b1',
      scope: 'workspace',
      scopeId: 'ws1',
      displayName: 'Acme',
      tomName: 'Sage',
      timName: 'Atlas',
      specialistRenames: { deny: 'Pixel' },
      primaryDomain: 'assistant.acme.com',
      themeTokens: defaultBrandIdentity().themeTokens,
      logoUrl: null,
      faviconUrl: null,
      emailSender: 'hello@acme.com',
      emailSignature: '— Acme Team',
      voiceIntro: 'Hi, this is {{agent}}',
      voiceVoiceId: 'voice-1',
      slackBotIdentity: { name: 'acme', displayName: 'Acme Bot', description: 'Helps with stuff' },
      legalLinks: { tos: 'https://acme.com/tos' },
      enabled: true,
    };
    const brand = brandIdentityFromRow(row);
    expect(brand.tomName).toBe('Sage');
    expect(brand.specialistRenames.deny).toBe('Pixel');
    expect(brand.slackBotIdentity?.name).toBe('acme');
    expect(brand.legalLinks?.tos).toBe('https://acme.com/tos');
    expect(brand.primaryDomain).toBe('assistant.acme.com');
  });

  it('uses defaults when jsonb fields are empty', () => {
    const row: BrandIdentityRow = {
      id: 'b1',
      scope: 'platform',
      scopeId: null,
      displayName: 'VitaOS',
      tomName: 'Tom',
      timName: 'Tim',
      specialistRenames: {},
      primaryDomain: null,
      themeTokens: {},
      logoUrl: null,
      faviconUrl: null,
      emailSender: null,
      emailSignature: null,
      voiceIntro: null,
      voiceVoiceId: null,
      slackBotIdentity: {},
      legalLinks: {},
      enabled: true,
    };
    const brand = brandIdentityFromRow(row);
    expect(brand.themeTokens.colors.primary).toBeDefined();
    expect(brand.slackBotIdentity).toBeUndefined();
    expect(brand.legalLinks).toBeUndefined();
    expect(brand.specialistRenames).toEqual({});
  });
});
