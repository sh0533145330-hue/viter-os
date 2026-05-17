import { describe, it, expect, vi, afterEach } from 'vitest';
import { StripeAdapter, StripeNotConfiguredError, resolveRevenueSplit, modelRequiresStripeConnect } from '../stripe-connect.js';
import type { BillingConfig } from '../types.js';

describe('StripeAdapter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('throws when API key missing', async () => {
    const a = new StripeAdapter({});
    await expect(a.createCustomer({ email: 'a@b.com' })).rejects.toThrow(StripeNotConfiguredError);
  });

  it('sends auth header', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'cus_1', email: 'a@b.com', metadata: {} })));
    const a = new StripeAdapter({ apiKey: 'sk_test_xyz' });
    await a.createCustomer({ email: 'a@b.com' });
    const [, opts] = spy.mock.calls[0] ?? [];
    expect((opts?.headers as Record<string, string>)['Authorization']).toBe('Bearer sk_test_xyz');
  });

  it('creates checkout session with subscription mode', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'cs_1', url: 'https://stripe.com/c/cs_1' })));
    const a = new StripeAdapter({ apiKey: 'sk' });
    const session = await a.createCheckoutSession({
      lineItems: [{ priceId: 'price_1', quantity: 1 }],
      successUrl: 'https://x/s', cancelUrl: 'https://x/c', mode: 'subscription',
    });
    expect(session.url).toBe('https://stripe.com/c/cs_1');
  });
});

describe('resolveRevenueSplit', () => {
  it('splits gross on revenue_share', () => {
    const config: BillingConfig = {
      id: 'b1', scope: 'agency', scopeId: 'a1', model: 'revenue_share',
      pricing: { currency: 'USD', revShare: { vitaPct: 30, agencyPct: 70 } },
      active: true, effectiveFrom: new Date(),
    };
    const split = resolveRevenueSplit(config);
    expect(split.vitaCents(10000)).toBe(3000);
    expect(split.agencyCents(10000)).toBe(7000);
  });

  it('gives everything to vita on direct model', () => {
    const config: BillingConfig = { id: 'b2', scope: 'workspace', scopeId: 'w1', model: 'direct', pricing: { currency: 'USD' }, active: true, effectiveFrom: new Date() };
    expect(resolveRevenueSplit(config).vitaCents(5000)).toBe(5000);
    expect(resolveRevenueSplit(config).agencyCents(5000)).toBe(0);
  });
});

describe('modelRequiresStripeConnect', () => {
  it('returns true for reseller and revenue_share', () => {
    expect(modelRequiresStripeConnect('reseller')).toBe(true);
    expect(modelRequiresStripeConnect('revenue_share')).toBe(true);
  });
  it('returns false for direct and bundled', () => {
    expect(modelRequiresStripeConnect('direct')).toBe(false);
    expect(modelRequiresStripeConnect('bundled')).toBe(false);
  });
});
