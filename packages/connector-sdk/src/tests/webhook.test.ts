import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  parseGithubSignature,
  parseSlackSignature,
  parseStripeSignature,
  verifyHmacSignature,
  WebhookReplayCache,
} from '../webhook.js';

const SECRET = 'shhh-its-a-secret';

describe('verifyHmacSignature', () => {
  it('accepts a matching sha256 hex signature', () => {
    const body = 'payload';
    const sig = createHmac('sha256', SECRET).update(body).digest('hex');
    expect(
      verifyHmacSignature({ payload: body, header: `sha256=${sig}`, secret: SECRET, scheme: 'sha256' }),
    ).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const body = 'payload';
    const sig = createHmac('sha256', SECRET).update(body).digest('hex');
    const tampered = sig.replace(/.$/u, (c) => (c === '0' ? '1' : '0'));
    expect(
      verifyHmacSignature({ payload: body, header: tampered, secret: SECRET, scheme: 'sha256' }),
    ).toBe(false);
  });

  it('rejects a wrong-length signature', () => {
    expect(
      verifyHmacSignature({ payload: 'x', header: 'deadbeef', secret: SECRET, scheme: 'sha256' }),
    ).toBe(false);
  });
});

describe('parseSlackSignature', () => {
  it('accepts a valid Slack v0 signature', () => {
    const ts = '1700000000';
    const body = 'token=xyz&team_id=T1';
    const sig = `v0=${createHmac('sha256', SECRET).update(`v0:${ts}:${body}`).digest('hex')}`;
    expect(
      parseSlackSignature({
        headers: { 'x-slack-request-timestamp': ts, 'x-slack-signature': sig },
        body,
        signingSecret: SECRET,
        now: () => Number.parseInt(ts, 10),
      }),
    ).toBe(true);
  });

  it('rejects when the timestamp is stale', () => {
    const ts = '1700000000';
    const body = 'x';
    const sig = `v0=${createHmac('sha256', SECRET).update(`v0:${ts}:${body}`).digest('hex')}`;
    expect(
      parseSlackSignature({
        headers: { 'x-slack-request-timestamp': ts, 'x-slack-signature': sig },
        body,
        signingSecret: SECRET,
        now: () => Number.parseInt(ts, 10) + 1000,
      }),
    ).toBe(false);
  });

  it('rejects when headers are missing', () => {
    expect(parseSlackSignature({ headers: {}, body: 'x', signingSecret: SECRET })).toBe(false);
  });
});

describe('parseGithubSignature', () => {
  it('verifies an X-Hub-Signature-256 header', () => {
    const body = '{"hello":"world"}';
    const sig = `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`;
    expect(
      parseGithubSignature({ headers: { 'x-hub-signature-256': sig }, body, secret: SECRET }),
    ).toBe(true);
  });

  it('rejects when header is absent', () => {
    expect(parseGithubSignature({ headers: {}, body: '{}', secret: SECRET })).toBe(false);
  });
});

describe('parseStripeSignature', () => {
  it('verifies a Stripe-Signature header', () => {
    const ts = '1700000000';
    const body = '{"id":"evt_1"}';
    const v1 = createHmac('sha256', SECRET).update(`${ts}.${body}`).digest('hex');
    expect(
      parseStripeSignature({
        headers: { 'stripe-signature': `t=${ts},v1=${v1}` },
        body,
        secret: SECRET,
        now: () => Number.parseInt(ts, 10),
      }),
    ).toBe(true);
  });

  it('rejects when v1 is missing', () => {
    expect(
      parseStripeSignature({
        headers: { 'stripe-signature': 't=1700000000' },
        body: '{}',
        secret: SECRET,
      }),
    ).toBe(false);
  });
});

describe('WebhookReplayCache', () => {
  it('accepts the first occurrence and rejects a duplicate within TTL', () => {
    let now = 1000;
    const cache = new WebhookReplayCache({ ttlMs: 5000, now: () => now });
    expect(cache.seen('a')).toBe(true);
    expect(cache.seen('a')).toBe(false);
    now += 6000;
    expect(cache.seen('a')).toBe(true);
  });

  it('enforces the bounded size', () => {
    const cache = new WebhookReplayCache({ ttlMs: 60_000, maxEntries: 3 });
    cache.seen('a');
    cache.seen('b');
    cache.seen('c');
    cache.seen('d');
    expect(cache.size()).toBe(3);
  });
});
