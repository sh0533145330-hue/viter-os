import { defineConnector, z } from '@vita/connector-sdk';

export const stripeConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  accountId: z.string().min(1),
  ingestKinds: z
    .array(z.enum(['charges', 'subscriptions', 'invoices']))
    .default(['charges', 'subscriptions']),
});

export type StripeConfig = z.infer<typeof stripeConfigSchema>;

export const stripe = defineConnector<StripeConfig>({
  key: 'stripe',
  name: 'Stripe',
  description: 'Ingest charges, subscriptions, and invoices from Stripe.',
  tier: 'native-api',
  provider: 'stripe',
  scopes: [],
  capabilities: [
    { key: 'list-charges', description: 'List recent charges on the account.' },
    { key: 'list-subscriptions', description: 'List active subscriptions.' },
    { key: 'list-invoices', description: 'List invoices for the account.' },
  ],
  configSchema: stripeConfigSchema,
  webhookKinds: [
    'stripe.charge.succeeded',
    'stripe.invoice.payment_failed',
    'stripe.customer.subscription.updated',
  ],
  rateLimit: { rpm: 100 },
});
