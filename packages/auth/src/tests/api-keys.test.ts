import { describe, expect, it } from 'vitest';
import {
  API_KEY_PREFIX_LIVE,
  API_KEY_PREFIX_TEST,
  extractApiKeyPrefix,
  generateApiKey,
  hashApiKey,
  verifyApiKey,
} from '../api-keys.js';

const FAST_SCRYPT = { N: 1024, r: 8, p: 1 } as const;

describe('generateApiKey', () => {
  it('produces a live-prefixed key by default', () => {
    const key = generateApiKey({ scrypt: FAST_SCRYPT });
    expect(key.raw.startsWith(API_KEY_PREFIX_LIVE)).toBe(true);
    expect(key.prefix).toBe(API_KEY_PREFIX_LIVE);
    expect(key.publicId.length).toBeGreaterThan(0);
    expect(key.hashed.startsWith('scrypt$')).toBe(true);
  });

  it('produces a test-prefixed key when requested', () => {
    const key = generateApiKey({ environment: 'test', scrypt: FAST_SCRYPT });
    expect(key.raw.startsWith(API_KEY_PREFIX_TEST)).toBe(true);
    expect(key.prefix).toBe(API_KEY_PREFIX_TEST);
  });

  it('is verifiable end-to-end', () => {
    const key = generateApiKey({ scrypt: FAST_SCRYPT });
    expect(verifyApiKey(key.raw, key.hashed)).toBe(true);
  });

  it('rejects different keys', () => {
    const a = generateApiKey({ scrypt: FAST_SCRYPT });
    const b = generateApiKey({ scrypt: FAST_SCRYPT });
    expect(verifyApiKey(a.raw, b.hashed)).toBe(false);
    expect(verifyApiKey(b.raw, a.hashed)).toBe(false);
  });

  it('rejects mutated keys', () => {
    const key = generateApiKey({ scrypt: FAST_SCRYPT });
    const tampered = `${key.raw.slice(0, key.raw.length - 1)}${key.raw.endsWith('a') ? 'b' : 'a'}`;
    expect(verifyApiKey(tampered, key.hashed)).toBe(false);
  });
});

describe('hashApiKey / verifyApiKey', () => {
  it('produces a parseable hash format', () => {
    const hash = hashApiKey('vita_live_abcdef_123456', FAST_SCRYPT);
    const parts = hash.split('$');
    expect(parts).toHaveLength(6);
    expect(parts[0]).toBe('scrypt');
  });

  it('rejects malformed stored hashes', () => {
    expect(verifyApiKey('vita_live_xxx', 'garbage')).toBe(false);
    expect(verifyApiKey('vita_live_xxx', 'scrypt$$$$$$')).toBe(false);
  });
});

describe('extractApiKeyPrefix', () => {
  it('extracts the prefix and public id from a generated key', () => {
    const key = generateApiKey({ scrypt: FAST_SCRYPT });
    const parsed = extractApiKeyPrefix(key.raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.prefix).toBe(API_KEY_PREFIX_LIVE);
    expect(parsed?.publicId).toBe(key.publicId);
  });

  it('returns null for unknown prefixes', () => {
    expect(extractApiKeyPrefix('sk_live_abc123')).toBeNull();
    expect(extractApiKeyPrefix('vita_live_')).toBeNull();
  });
});
