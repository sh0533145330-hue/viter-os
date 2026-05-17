import { defineConnector, z } from '@vita/connector-sdk';

export const quickbooksConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  realmId: z.string().min(1),
});

export type QuickbooksConfig = z.infer<typeof quickbooksConfigSchema>;

export const quickbooks = defineConnector<QuickbooksConfig>({
  key: 'quickbooks',
  name: 'QuickBooks',
  description: 'Ingest invoices, customers, and ledger entries from QuickBooks.',
  tier: 'oauth-nango',
  provider: 'quickbooks',
  scopes: ['com.intuit.quickbooks.accounting'],
  capabilities: [
    { key: 'list-invoices', description: 'List invoices for the company.' },
    { key: 'list-customers', description: 'List customers for the company.' },
    { key: 'list-accounts', description: 'List GL accounts.' },
  ],
  configSchema: quickbooksConfigSchema,
  webhookKinds: ['quickbooks.invoice.updated', 'quickbooks.customer.updated'],
  rateLimit: { rpm: 60 },
});
