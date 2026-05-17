import { defineConnector, z } from '@vita/connector-sdk';

export const notionConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  rootPageIds: z.array(z.string()).default([]),
});

export type NotionConfig = z.infer<typeof notionConfigSchema>;

export const notion = defineConnector<NotionConfig>({
  key: 'notion',
  name: 'Notion',
  description: 'Ingest pages, databases, and comments from Notion.',
  tier: 'oauth-nango',
  provider: 'notion',
  scopes: [],
  capabilities: [
    { key: 'list-pages', description: 'List Notion pages reachable from the granted scope.' },
    { key: 'fetch-page', description: 'Fetch the full contents of a Notion page.' },
    { key: 'query-database', description: 'Query a Notion database.' },
  ],
  configSchema: notionConfigSchema,
  webhookKinds: [],
  rateLimit: { rpm: 180 },
});
