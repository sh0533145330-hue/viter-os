import { describe, expect, it } from 'vitest';
import {
  buildEmailFromHeader,
  buildEmailSignature,
  extractEmailDomain,
  generateDkimRecords,
  generateDmarcRecord,
  generateSpfRecord,
} from '../email-identity.js';
import { defaultBrandIdentity } from '../identity.js';
import type { BrandIdentity } from '../types.js';

function brand(overrides: Partial<BrandIdentity>): BrandIdentity {
  return { ...defaultBrandIdentity(), ...overrides };
}

describe('buildEmailFromHeader', () => {
  it('uses brand emailSender when present', () => {
    const header = buildEmailFromHeader(
      brand({ displayName: 'Acme', emailSender: 'hi@acme.com' }),
      'fallback@vitaos.app',
    );
    expect(header).toBe('Acme <hi@acme.com>');
  });

  it('falls back when brand emailSender missing', () => {
    const header = buildEmailFromHeader(brand({ displayName: 'Acme' }), 'fallback@vitaos.app');
    expect(header).toBe('Acme <fallback@vitaos.app>');
  });

  it('throws on invalid fallback', () => {
    expect(() => buildEmailFromHeader(brand({ displayName: 'Acme' }), 'not-an-email')).toThrow();
  });
});

describe('buildEmailSignature', () => {
  it('returns the brand signature when set', () => {
    expect(buildEmailSignature(brand({ emailSignature: '— Acme Ops' }))).toBe('— Acme Ops');
  });

  it('falls back to display-name signature', () => {
    expect(buildEmailSignature(brand({ displayName: 'Acme' }))).toBe('— Acme');
  });

  it('respects fallback argument', () => {
    expect(buildEmailSignature(brand({ displayName: 'Acme' }), 'custom')).toBe('custom');
  });
});

describe('generateDkimRecords', () => {
  it('produces DKIM TXT records for each selector', () => {
    const records = generateDkimRecords(brand({ emailSender: 'hi@acme.com' }), [
      { selector: 's1', publicKey: 'AAA' },
      { selector: 's2', publicKey: 'BBB' },
    ]);
    expect(records).toHaveLength(2);
    expect(records[0]?.name).toBe('s1._domainkey.acme.com');
    expect(records[0]?.value).toContain('v=DKIM1');
    expect(records[0]?.value).toContain('p=AAA');
  });

  it('throws when brand has no sender or domain', () => {
    expect(() => generateDkimRecords(brand({}), { selector: 's1', publicKey: 'AAA' })).toThrow();
  });
});

describe('generateSpfRecord', () => {
  it('builds an SPF record with includes', () => {
    const r = generateSpfRecord(brand({ emailSender: 'hi@acme.com' }), [
      'sendgrid.net',
      'amazonses.com',
    ]);
    expect(r.type).toBe('TXT');
    expect(r.name).toBe('acme.com');
    expect(r.value).toContain('v=spf1');
    expect(r.value).toContain('include:sendgrid.net');
    expect(r.value).toContain('-all');
  });
});

describe('generateDmarcRecord', () => {
  it('defaults to quarantine policy', () => {
    const r = generateDmarcRecord(brand({ emailSender: 'hi@acme.com' }));
    expect(r.name).toBe('_dmarc.acme.com');
    expect(r.value).toContain('p=quarantine');
  });
});

describe('extractEmailDomain', () => {
  it('returns the domain part', () => {
    expect(extractEmailDomain('hi@Acme.COM')).toBe('acme.com');
  });

  it('returns undefined for malformed input', () => {
    expect(extractEmailDomain('no-at-sign')).toBeUndefined();
  });
});
