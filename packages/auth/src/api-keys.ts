import { Buffer } from 'node:buffer';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const API_KEY_PREFIX_LIVE = 'vita_live_';
export const API_KEY_PREFIX_TEST = 'vita_test_';

export type ApiKeyEnvironment = 'live' | 'test';

export interface GeneratedApiKey {
  raw: string;
  hashed: string;
  prefix: string;
  publicId: string;
}

interface ScryptParams {
  N: number;
  r: number;
  p: number;
  keylen: number;
  saltLen: number;
}

const DEFAULT_SCRYPT: ScryptParams = {
  N: 1 << 14,
  r: 8,
  p: 1,
  keylen: 64,
  saltLen: 16,
};

const BASE32_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

function base32(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      const idx = (value >>> (bits - 5)) & 0x1f;
      out += BASE32_ALPHABET[idx];
      bits -= 5;
    }
  }
  if (bits > 0) {
    const idx = (value << (5 - bits)) & 0x1f;
    out += BASE32_ALPHABET[idx];
  }
  return out;
}

export interface GenerateApiKeyOptions {
  environment?: ApiKeyEnvironment;
  prefix?: string;
  secretBytes?: number;
  scrypt?: Partial<ScryptParams>;
}

export function generateApiKey(options: GenerateApiKeyOptions = {}): GeneratedApiKey {
  const env = options.environment ?? 'live';
  const prefix = options.prefix ?? (env === 'live' ? API_KEY_PREFIX_LIVE : API_KEY_PREFIX_TEST);
  const secretBytes = options.secretBytes ?? 32;
  const publicIdBytes = randomBytes(8);
  const secret = randomBytes(secretBytes);
  const publicId = base32(publicIdBytes).slice(0, 12).toLowerCase();
  const raw = `${prefix}${publicId}_${base32(secret).toLowerCase()}`;
  const hashed = hashApiKey(raw, options.scrypt);
  return { raw, hashed, prefix, publicId };
}

export function hashApiKey(raw: string, scrypt: Partial<ScryptParams> = {}): string {
  const params: ScryptParams = { ...DEFAULT_SCRYPT, ...scrypt };
  const salt = randomBytes(params.saltLen);
  const derived = scryptSync(raw, salt, params.keylen, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: 128 * params.N * params.r * 4,
  });
  return [
    'scrypt',
    `${params.N}`,
    `${params.r}`,
    `${params.p}`,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$');
}

export function verifyApiKey(raw: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltB64 = parts[4] ?? '';
  const hashB64 = parts[5] ?? '';
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  if (salt.length === 0 || expected.length === 0) return false;
  const derived = scryptSync(raw, salt, expected.length, {
    N,
    r,
    p,
    maxmem: 128 * N * r * 4,
  });
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function extractApiKeyPrefix(raw: string): { prefix: string; publicId: string } | null {
  if (raw.startsWith(API_KEY_PREFIX_LIVE)) {
    return splitPrefixedKey(raw, API_KEY_PREFIX_LIVE);
  }
  if (raw.startsWith(API_KEY_PREFIX_TEST)) {
    return splitPrefixedKey(raw, API_KEY_PREFIX_TEST);
  }
  return null;
}

function splitPrefixedKey(
  raw: string,
  prefix: string,
): { prefix: string; publicId: string } | null {
  const remainder = raw.slice(prefix.length);
  const sepIdx = remainder.indexOf('_');
  if (sepIdx <= 0) return null;
  return { prefix, publicId: remainder.slice(0, sepIdx) };
}
