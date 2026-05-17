/**
 * Webhook signature verification + replay protection.
 *
 * Provides a generic HMAC verifier with constant-time comparison
 * (via `crypto.timingSafeEqual`), provider-specific parsers for
 * Slack / GitHub / Stripe, and a bounded TTL replay cache.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export type HmacScheme = 'sha256' | 'sha1';

export interface VerifyHmacParams {
  readonly payload: string | Buffer;
  readonly header: string;
  readonly secret: string;
  readonly scheme: HmacScheme;
}

function toBuffer(input: string | Buffer): Buffer {
  return typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
}

function computeHmac(payload: string | Buffer, secret: string, scheme: HmacScheme): Buffer {
  return createHmac(scheme, secret).update(toBuffer(payload)).digest();
}

function safeCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Verify a hex- or base64-encoded HMAC signature against a payload
 * using constant-time comparison.
 */
export function verifyHmacSignature(params: VerifyHmacParams): boolean {
  const expected = computeHmac(params.payload, params.secret, params.scheme);
  const provided = decodeSignature(params.header);
  if (!provided) return false;
  return safeCompare(expected, provided);
}

function decodeSignature(header: string): Buffer | undefined {
  const cleaned = header.replace(/^(sha256=|sha1=)/iu, '').trim();
  if (/^[0-9a-fA-F]+$/u.test(cleaned) && cleaned.length % 2 === 0) {
    return Buffer.from(cleaned, 'hex');
  }
  try {
    return Buffer.from(cleaned, 'base64');
  } catch {
    return undefined;
  }
}

export interface SlackSignatureParams {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly body: string | Buffer;
  readonly signingSecret: string;
  /** Maximum age of the signed request in seconds. */
  readonly maxAgeSeconds?: number | undefined;
  /** Override for the current time, exposed for tests. */
  readonly now?: () => number;
}

function firstHeader(
  headers: Readonly<Record<string, string | string[] | undefined>>,
  key: string,
): string | undefined {
  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() !== lower) continue;
    if (Array.isArray(v)) return v[0];
    return v;
  }
  return undefined;
}

/** Verify a Slack-style `v0=hex(hmac(sha256, secret, "v0:ts:body"))` signature. */
export function parseSlackSignature(params: SlackSignatureParams): boolean {
  const ts = firstHeader(params.headers, 'x-slack-request-timestamp');
  const sig = firstHeader(params.headers, 'x-slack-signature');
  if (!ts || !sig) return false;
  const tsNum = Number.parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) return false;
  const maxAge = params.maxAgeSeconds ?? 300;
  const now = (params.now ?? (() => Math.floor(Date.now() / 1000)))();
  if (Math.abs(now - tsNum) > maxAge) return false;
  const baseString = `v0:${ts}:${typeof params.body === 'string' ? params.body : params.body.toString('utf8')}`;
  const expected = `v0=${createHmac('sha256', params.signingSecret).update(baseString).digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export interface GithubSignatureParams {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly body: string | Buffer;
  readonly secret: string;
}

/** Verify a GitHub `X-Hub-Signature-256: sha256=<hex>` header. */
export function parseGithubSignature(params: GithubSignatureParams): boolean {
  const sig = firstHeader(params.headers, 'x-hub-signature-256');
  if (!sig) return false;
  return verifyHmacSignature({
    payload: params.body,
    header: sig,
    secret: params.secret,
    scheme: 'sha256',
  });
}

export interface StripeSignatureParams {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly body: string | Buffer;
  readonly secret: string;
  readonly maxAgeSeconds?: number | undefined;
  readonly now?: () => number;
}

/**
 * Verify a Stripe `Stripe-Signature` header of the form
 * `t=<unix>,v1=<hex>` against `<t>.<body>`.
 */
export function parseStripeSignature(params: StripeSignatureParams): boolean {
  const sig = firstHeader(params.headers, 'stripe-signature');
  if (!sig) return false;
  const parts = sig.split(',').map((p) => p.trim());
  let ts: string | undefined;
  const candidates: string[] = [];
  for (const part of parts) {
    const [k, v] = part.split('=', 2);
    if (!k || v === undefined) continue;
    if (k === 't') ts = v;
    else if (k === 'v1') candidates.push(v);
  }
  if (!ts || candidates.length === 0) return false;
  const tsNum = Number.parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) return false;
  const maxAge = params.maxAgeSeconds ?? 300;
  const now = (params.now ?? (() => Math.floor(Date.now() / 1000)))();
  if (Math.abs(now - tsNum) > maxAge) return false;
  const baseString = `${ts}.${typeof params.body === 'string' ? params.body : params.body.toString('utf8')}`;
  const expected = createHmac('sha256', params.secret).update(baseString).digest();
  for (const cand of candidates) {
    if (!/^[0-9a-fA-F]+$/u.test(cand) || cand.length % 2 !== 0) continue;
    const provided = Buffer.from(cand, 'hex');
    if (provided.length !== expected.length) continue;
    if (timingSafeEqual(expected, provided)) return true;
  }
  return false;
}

/**
 * Bounded TTL set used to reject duplicate signature/timestamp
 * pairs. Eviction is amortised over insertion.
 */
export class WebhookReplayCache {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly entries = new Map<string, number>();
  private readonly now: () => number;

  constructor(opts?: { ttlMs?: number; maxEntries?: number; now?: () => number }) {
    this.ttlMs = opts?.ttlMs ?? 5 * 60 * 1000;
    this.maxEntries = opts?.maxEntries ?? 5000;
    this.now = opts?.now ?? (() => Date.now());
  }

  /**
   * Record `key`. Returns `false` if the key was already seen and is
   * still within the TTL window — callers should reject the request.
   */
  seen(key: string): boolean {
    this.evict();
    const at = this.entries.get(key);
    if (at !== undefined && this.now() - at < this.ttlMs) {
      return false;
    }
    if (this.entries.size >= this.maxEntries) {
      const firstKey = this.entries.keys().next().value;
      if (firstKey !== undefined) this.entries.delete(firstKey);
    }
    this.entries.set(key, this.now());
    return true;
  }

  size(): number {
    return this.entries.size;
  }

  private evict(): void {
    const cutoff = this.now() - this.ttlMs;
    for (const [k, at] of this.entries) {
      if (at < cutoff) this.entries.delete(k);
      else break;
    }
  }
}
