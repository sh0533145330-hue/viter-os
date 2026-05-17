import { describe, expect, it } from 'vitest';
import { PiiRedactor } from '../redactor.js';

describe('PiiRedactor', () => {
  // ── Basic detection ────────────────────────────────────────

  it('detects emails in text', () => {
    const redactor = new PiiRedactor();
    const matches = redactor.detect('Contact john.doe@example.com for details');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    const emailMatch = matches.find((m) => m.type === 'email');
    expect(emailMatch).toBeDefined();
    expect(emailMatch!.text).toBe('john.doe@example.com');
  });

  it('detects phone numbers in US format', () => {
    const redactor = new PiiRedactor();
    const matches = redactor.detect('Call (555) 123-4567 for support');
    const phoneMatch = matches.find((m) => m.type === 'phone');
    expect(phoneMatch).toBeDefined();
    expect(phoneMatch!.text).toContain('555');
  });

  it('detects SSN patterns', () => {
    const redactor = new PiiRedactor();
    const matches = redactor.detect('SSN: 123-45-6789 was provided');
    const ssnMatch = matches.find((m) => m.type === 'ssn');
    expect(ssnMatch).toBeDefined();
    expect(ssnMatch!.text).toBe('123-45-6789');
  });

  it('detects credit card numbers', () => {
    const redactor = new PiiRedactor();
    const matches = redactor.detect('Paid with 4111-1111-1111-1111 yesterday');
    const ccMatch = matches.find((m) => m.type === 'credit_card');
    expect(ccMatch).toBeDefined();
  });

  it('detects IP addresses', () => {
    const redactor = new PiiRedactor();
    const matches = redactor.detect('Accessed from 192.168.1.100 at noon');
    const ipMatch = matches.find((m) => m.type === 'ip_address');
    expect(ipMatch).toBeDefined();
    expect(ipMatch!.text).toBe('192.168.1.100');
  });

  // ── Redaction ──────────────────────────────────────────────

  it('redacts emails from text', () => {
    const redactor = new PiiRedactor();
    const { cleaned } = redactor.redact('Email me at alice@example.com or bob@test.org');
    expect(cleaned).not.toContain('alice@example.com');
    expect(cleaned).not.toContain('bob@test.org');
    expect(cleaned).toContain('[REDACTED:email]');
  });

  it('redacts multiple PII types in one pass', () => {
    const redactor = new PiiRedactor();
    const text = 'Patient John (john@clinic.com) has SSN 987-65-4321';
    const { cleaned, matches } = redactor.redact(text);
    expect(cleaned).not.toContain('john@clinic.com');
    expect(cleaned).not.toContain('987-65-4321');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('returns clean text unchanged when no PII', () => {
    const redactor = new PiiRedactor();
    const { cleaned, matches } = redactor.redact('The weather is nice today.');
    expect(cleaned).toBe('The weather is nice today.');
    expect(matches).toHaveLength(0);
  });

  // ── Tagged redaction ───────────────────────────────────────

  it('redactWithTags replaces PII with type tags', () => {
    const redactor = new PiiRedactor();
    const { cleaned, piiTags } = redactor.redactWithTags('Email alice@example.com or call 555-123-4567');
    expect(cleaned).toContain('[PII:email]');
    expect(cleaned).toContain('[PII:phone]');
    expect(piiTags).toContain('[PII:email]');
    expect(piiTags).toContain('[PII:phone]');
  });

  it('redactWithTags on clean text returns empty tags', () => {
    const redactor = new PiiRedactor();
    const { cleaned, piiTags } = redactor.redactWithTags('Just a normal sentence.');
    expect(cleaned).toBe('Just a normal sentence.');
    expect(piiTags).toHaveLength(0);
  });

  // ── Strictness levels ──────────────────────────────────────

  it('standard level includes basic PII types', () => {
    const r = new PiiRedactor({ strictness: 'standard' });
    const matches = r.detect('email: test@test.com, phone: 555-123-4567');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('strict level includes additional patterns', () => {
    const r = new PiiRedactor({ strictness: 'strict' });
    const matches = r.detect('Account #: acct-12345678');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('healthcare level includes HIPAA identifiers', () => {
    const r = new PiiRedactor({ strictness: 'healthcare' });
    const matches = r.detect('MRN: 12345678 and HP-987654321A');
    const mrnMatch = matches.find((m) => m.type === 'medical_record');
    expect(mrnMatch).toBeDefined();
  });

  // ── Custom configuration ───────────────────────────────────

  it('respects excludeTypes option', () => {
    const r = new PiiRedactor({ excludeTypes: ['email'] });
    const matches = r.detect('alice@example.com and 555-123-4567');
    const emailMatch = matches.find((m) => m.type === 'email');
    expect(emailMatch).toBeUndefined();
    expect(matches.some((m) => m.type === 'phone')).toBe(true);
  });

  it('uses custom replacement strings', () => {
    const r = new PiiRedactor({
      replacements: { email: '***EMAIL***' } as Partial<Record<import('../types.js').PiiType, string>>,
    });
    const { cleaned } = r.redact('Contact john@doe.com');
    expect(cleaned).toContain('***EMAIL***');
  });

  it('applies extra custom patterns', () => {
    const r = new PiiRedactor({
      extraPatterns: [
        { type: 'name', pattern: '\\bAlice Smith\\b' },
      ],
    });
    const matches = r.detect('Alice Smith reported the issue');
    expect(matches.some((m) => m.type === 'name')).toBe(true);
  });

  // ── Edge cases ─────────────────────────────────────────────

  it('handles empty string', () => {
    const r = new PiiRedactor();
    const { cleaned, matches } = r.redact('');
    expect(cleaned).toBe('');
    expect(matches).toHaveLength(0);
  });

  it('handles text with only PII', () => {
    const r = new PiiRedactor();
    const { cleaned } = r.redact('alice@example.com');
    expect(cleaned).not.toContain('@');
    expect(cleaned.length).toBeGreaterThan(0);
  });

  it('handles overlapping matches by keeping the longer one', () => {
    const r = new PiiRedactor();
    // A SSN-like number that also looks like a CC number
    const result = r.redact('123-45-6789 is valid');
    // Should not have duplicate matches for the same text span
    expect(result.matches.filter((m) => m.text === '123-45-6789').length).toBeLessThanOrEqual(1);
  });

  it('handles very long text efficiently', () => {
    const r = new PiiRedactor();
    const longText = Array.from({ length: 100 }, () => 'alice@example.com').join(' ');
    const matches = r.detect(longText);
    expect(matches.length).toBe(100);
  });
});
