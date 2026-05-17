import { defineConnector, z } from '@vita/connector-sdk';

export const hubspotConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  portalId: z.string().min(1),
});

export type HubspotConfig = z.infer<typeof hubspotConfigSchema>;

export const hubspot = defineConnector<HubspotConfig>({
  key: 'hubspot',
  name: 'HubSpot',
  description: 'Ingest contacts, deals, and engagements from HubSpot CRM.',
  tier: 'oauth-nango',
  provider: 'hubspot',
  scopes: ['crm.objects.contacts.read', 'crm.objects.deals.read', 'crm.objects.companies.read'],
  capabilities: [
    { key: 'list-contacts', description: 'List CRM contacts.' },
    { key: 'list-deals', description: 'List CRM deals.' },
    { key: 'list-companies', description: 'List CRM companies.' },
  ],
  configSchema: hubspotConfigSchema,
  webhookKinds: ['hubspot.contact.creation', 'hubspot.deal.propertyChange'],
  rateLimit: { rpm: 100 },
});
