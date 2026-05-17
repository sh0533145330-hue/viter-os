import { describe, expect, it } from 'vitest';
import { createLogRedactor, redactSensitiveKeys, SENSITIVE_KEYS, REDACTED_VALUE } from './pii-redaction.js';

describe('redactSensitiveKeys', () => {
  it('redacts known sensitive keys', () => {
    const obj = { password: 'hunter2', token: 'abc123', email: 'user@test.com', safe: 'ok' };
    const result = redactSensitiveKeys(obj) as Record<string, unknown>;
    expect(result.password).toBe(REDACTED_VALUE);
    expect(result.token).toBe(REDACTED_VALUE);
    expect(result.email).toBe(REDACTED_VALUE);
    expect(result.safe).toBe('ok');
  });

  it('redacts nested sensitive keys', () => {
    const obj = { payload: { email: 'a@b.com', phone: '555-1234' }, meta: { name: 'public' } };
    const result = redactSensitiveKeys(obj) as Record<string, unknown>;
    const payload = result.payload as Record<string, unknown>;
    expect(payload.email).toBe(REDACTED_VALUE);
    expect(payload.phone).toBe(REDACTED_VALUE);
  });

  it('handles arrays', () => {
    const obj = { items: [{ apiKey: 'sk-123' }, { apiKey: 'sk-456' }] };
    const result = redactSensitiveKeys(obj) as Record<string, unknown>;
    const items = result.items as Array<Record<string, unknown>>;
    expect(items[0]!.apiKey).toBe(REDACTED_VALUE);
    expect(items[1]!.apiKey).toBe(REDACTED_VALUE);
  });

  it('handles null and undefined', () => {
    expect(redactSensitiveKeys(null)).toBe(null);
    expect(redactSensitiveKeys(undefined)).toBe(undefined);
  });

  it('handles primitives', () => {
    expect(redactSensitiveKeys(42)).toBe(42);
    expect(redactSensitiveKeys(true)).toBe(true);
  });

  it('truncates long strings', () => {
    const long = 'x'.repeat(6000);
    const result = redactSensitiveKeys(long) as string;
    expect(result.length).toBeLessThan(6000);
    expect(result).toContain('TRUNCATED');
  });

  it('enforces max depth', () => {
    const deep: Record<string, unknown> = { a: {} };
    let current = deep.a as Record<string, unknown>;
    for (let i = 0; i < 12; i++) {
      current.b = {};
      current = current.b as Record<string, unknown>;
    }
    const result = redactSensitiveKeys(deep) as Record<string, unknown>;
    expect(JSON.stringify(result)).toContain('MAX_DEPTH');
  });

  it('SENSTITIVE_KEYS contains expected entries', () => {
    expect(SENSITIVE_KEYS).toContain('password');
    expect(SENSITIVE_KEYS).toContain('token');
    expect(SENSITIVE_KEYS).toContain('ssn');
    expect(SENSITIVE_KEYS).toContain('email');
  });
});

describe('createLogRedactor', () => {
  it('redacts sensitive keys in objects', () => {
    const redactor = createLogRedactor();
    const result = redactor({ password: 'secret', data: 'visible' }) as Record<string, unknown>;
    expect(result.password).toBe(REDACTED_VALUE);
    expect(result.data).toBe('visible');
  });

  it('redacts PII in string values when redactPiiInStrings is true', () => {
    const redactor = createLogRedactor({ redactPiiInStrings: true });
    const result = redactor('contact alice@example.com for info') as string;
    expect(result).not.toContain('alice@example.com');
  });

  it('skips string PII redaction when redactPiiInStrings is false', () => {
    const redactor = createLogRedactor({ redactPiiInStrings: false });
    const result = redactor('contact alice@example.com for info') as string;
    expect(result).toContain('alice@example.com');
  });

  it('supports extra sensitive keys', () => {
    const redactor = createLogRedactor({ extraSensitiveKeys: ['customSecret'] });
    const result = redactor({ customSecret: 'shh', normal: 'hi' }) as Record<string, unknown>;
    expect(result.customSecret).toBe(REDACTED_VALUE);
    expect(result.normal).toBe('hi');
  });

  it('redacts Error messages for PII', () => {
    const redactor = createLogRedactor({ redactPiiInStrings: true });
    const err = new Error('user bob@test.com failed');
    const result = redactor(err) as Record<string, unknown>;
    expect(result.message).not.toContain('bob@test.com');
  });

  it('preserves Error structure', () => {
    const redactor = createLogRedactor();
    const err = new Error('something broke');
    const result = redactor(err) as Record<string, unknown>;
    expect(result.name).toBe('Error');
    expect(result).toHaveProperty('message');
  });
});
