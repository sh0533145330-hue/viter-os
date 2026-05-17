import { defineConnector, z } from '@vita/connector-sdk';

export const linearConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  teamIds: z.array(z.string()).default([]),
});

export type LinearConfig = z.infer<typeof linearConfigSchema>;

export const linear = defineConnector<LinearConfig>({
  key: 'linear',
  name: 'Linear',
  description: 'Ingest Linear issues and project updates.',
  tier: 'oauth-nango',
  provider: 'linear',
  scopes: ['read', 'write'],
  capabilities: [
    { key: 'list-issues', description: 'List issues in scoped teams.' },
    { key: 'create-issue', description: 'Create a new Linear issue.' },
    { key: 'update-issue', description: 'Update an existing Linear issue.' },
  ],
  configSchema: linearConfigSchema,
  webhookKinds: ['linear.issue.created', 'linear.issue.updated', 'linear.comment.created'],
  rateLimit: { rpm: 60 },
});
