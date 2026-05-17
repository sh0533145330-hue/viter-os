import { defineConnector, z } from '@vita/connector-sdk';

export const salesforceConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  instanceUrl: z.string().url(),
});

export type SalesforceConfig = z.infer<typeof salesforceConfigSchema>;

export const salesforce = defineConnector<SalesforceConfig>({
  key: 'salesforce',
  name: 'Salesforce',
  description: 'Ingest Accounts, Opportunities, and Cases from Salesforce.',
  tier: 'oauth-nango',
  provider: 'salesforce',
  scopes: ['api', 'refresh_token'],
  capabilities: [
    { key: 'soql-query', description: 'Run a SOQL query against the org.' },
    { key: 'list-accounts', description: 'List Account records.' },
    { key: 'list-opportunities', description: 'List Opportunity records.' },
  ],
  configSchema: salesforceConfigSchema,
  webhookKinds: ['salesforce.platform_event'],
  rateLimit: { rpm: 100 },
});
