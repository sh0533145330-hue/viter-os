import type { BillingConfig, BillingModel } from './types.js';

export interface StripeConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('Stripe API key not configured');
    this.name = 'StripeNotConfiguredError';
  }
}

export interface CheckoutSession {
  id: string;
  url: string;
  customerId?: string;
}

export interface Customer {
  id: string;
  email?: string;
  metadata: Record<string, string>;
}

export interface ConnectedAccount {
  id: string;
  email: string;
  type: 'express' | 'standard' | 'custom';
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export class StripeAdapter {
  constructor(private config: StripeConfig) {}

  private getApiKey(): string {
    if (!this.config.apiKey) throw new StripeNotConfiguredError();
    return this.config.apiKey;
  }

  private get baseUrl(): string {
    return this.config.baseUrl ?? 'https://api.stripe.com/v1';
  }

  private async post<T>(path: string, body: Record<string, string | number>, stripeAccount?: string): Promise<T> {
    const apiKey = this.getApiKey();
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) params.append(k, String(v));
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (stripeAccount) headers['Stripe-Account'] = stripeAccount;
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'POST', headers, body: params.toString() });
    if (!res.ok) throw new Error(`Stripe error ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  private async get<T>(path: string): Promise<T> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}${path}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) throw new Error(`Stripe error ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  async createCustomer(opts: { email: string; metadata?: Record<string, string> }): Promise<Customer> {
    const body: Record<string, string> = { email: opts.email };
    if (opts.metadata) for (const [k, v] of Object.entries(opts.metadata)) body[`metadata[${k}]`] = v;
    const result = await this.post<{ id: string; email?: string; metadata: Record<string, string> }>('/customers', body);
    const customer: Customer = { id: result.id, metadata: result.metadata };
    if (result.email) customer.email = result.email;
    return customer;
  }

  async createConnectedAccount(opts: { email: string; country: string }): Promise<ConnectedAccount> {
    const result = await this.post<ConnectedAccount>('/accounts', { type: 'express', email: opts.email, country: opts.country });
    return result;
  }

  async createAccountLink(opts: { account: string; refreshUrl: string; returnUrl: string }): Promise<{ url: string; expiresAt: number }> {
    return this.post<{ url: string; expires_at: number }>('/account_links', {
      account: opts.account,
      refresh_url: opts.refreshUrl,
      return_url: opts.returnUrl,
      type: 'account_onboarding',
    }).then(r => ({ url: r.url, expiresAt: r.expires_at }));
  }

  async createCheckoutSession(opts: {
    customer?: string;
    lineItems: Array<{ priceId: string; quantity: number }>;
    successUrl: string;
    cancelUrl: string;
    mode: 'subscription' | 'payment';
    applicationFeePercent?: number;
    onBehalfOfAccount?: string;
  }): Promise<CheckoutSession> {
    const body: Record<string, string | number> = {
      mode: opts.mode,
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
    };
    if (opts.customer) body['customer'] = opts.customer;
    opts.lineItems.forEach((item, i) => {
      body[`line_items[${i}][price]`] = item.priceId;
      body[`line_items[${i}][quantity]`] = item.quantity;
    });
    if (opts.applicationFeePercent !== undefined && opts.mode === 'subscription') {
      body['subscription_data[application_fee_percent]'] = opts.applicationFeePercent;
    }
    const result = await this.post<{ id: string; url: string; customer?: string }>(
      '/checkout/sessions',
      body,
      opts.onBehalfOfAccount,
    );
    const session: CheckoutSession = { id: result.id, url: result.url };
    if (result.customer) session.customerId = result.customer;
    return session;
  }

  async retrieveAccount(accountId: string): Promise<ConnectedAccount> {
    return this.get<ConnectedAccount>(`/accounts/${accountId}`);
  }
}

export function resolveRevenueSplit(config: BillingConfig): { vitaCents: (gross: number) => number; agencyCents: (gross: number) => number } {
  const split = config.pricing.revShare;
  if (config.model === 'revenue_share' && split) {
    return {
      vitaCents: (gross) => Math.floor(gross * (split.vitaPct / 100)),
      agencyCents: (gross) => Math.floor(gross * (split.agencyPct / 100)),
    };
  }
  if (config.model === 'reseller') {
    return { vitaCents: (gross) => gross, agencyCents: () => 0 };
  }
  if (config.model === 'bundled') {
    return { vitaCents: (gross) => gross, agencyCents: () => 0 };
  }
  return { vitaCents: (gross) => gross, agencyCents: () => 0 };
}

export function modelRequiresStripeConnect(model: BillingModel): boolean {
  return model === 'reseller' || model === 'revenue_share';
}
