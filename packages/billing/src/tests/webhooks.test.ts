import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyStripeSignature, StripeSignatureError, StripeWebhookRouter } from '../webhooks.js';

function sign(payload: string, secret: string, timestamp: number): string {
  const signed = `${timestamp}.${payload}`;
  const sig = createHmac('sha256', secret).update(signed).digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

const validEvent = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { id: 'cs_1' } }, livemode: false, created: 0 });

describe('verifyStripeSignature', () => {
  it('verifies a valid signature', () => {
    const now = Math.floor(Date.now() / 1000);
    const header = sign(validEvent, 'whsec_test', now);
    const event = verifyStripeSignature(validEvent, header, 'whsec_test');
    expect(event.id).toBe('evt_1');
  });

  it('rejects wrong secret', () => {
    const now = Math.floor(Date.now() / 1000);
    const header = sign(validEvent, 'whsec_correct', now);
    expect(() => verifyStripeSignature(validEvent, header, 'whsec_wrong')).toThrow(StripeSignatureError);
  });

  it('rejects stale timestamp', () => {
    const stale = Math.floor(Date.now() / 1000) - 1000;
    const header = sign(validEvent, 'whsec_test', stale);
    expect(() => verifyStripeSignature(validEvent, header, 'whsec_test')).toThrow(StripeSignatureError);
  });

  it('rejects malformed header', () => {
    expect(() => verifyStripeSignature(validEvent, 'bad-header', 'whsec_test')).toThrow(StripeSignatureError);
  });
});

describe('StripeWebhookRouter', () => {
  it('dispatches to registered handler', async () => {
    const router = new StripeWebhookRouter();
    let called = false;
    router.on('checkout.session.completed', () => { called = true; });
    const result = await router.dispatch({ id: 'evt_x', type: 'checkout.session.completed', data: { object: {} }, livemode: false, created: 0 });
    expect(result.delivered).toBe(true);
    expect(called).toBe(true);
  });

  it('ignores duplicate event ids', async () => {
    const router = new StripeWebhookRouter();
    let count = 0;
    router.on('invoice.paid', () => { count++; });
    const evt = { id: 'evt_dup', type: 'invoice.paid', data: { object: {} }, livemode: false, created: 0 };
    await router.dispatch(evt);
    const second = await router.dispatch(evt);
    expect(count).toBe(1);
    expect(second.delivered).toBe(false);
  });

  it('supports multiple handlers per event', async () => {
    const router = new StripeWebhookRouter();
    let total = 0;
    router.on('payment_intent.succeeded', () => { total += 1; });
    router.on('payment_intent.succeeded', () => { total += 10; });
    await router.dispatch({ id: 'evt_m', type: 'payment_intent.succeeded', data: { object: {} }, livemode: false, created: 0 });
    expect(total).toBe(11);
  });
});
