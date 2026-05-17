import { defineConnector, z } from '@vita/connector-sdk';

export const githubConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  installationId: z.string().optional(),
  repositoryAllowlist: z.array(z.string()).default([]),
});

export type GithubConfig = z.infer<typeof githubConfigSchema>;

export const github = defineConnector<GithubConfig>({
  key: 'github',
  name: 'GitHub',
  description: 'Ingest GitHub repositories, pull requests, and issues.',
  tier: 'oauth-nango',
  provider: 'github',
  scopes: ['repo', 'read:org'],
  capabilities: [
    { key: 'list-pulls', description: 'List pull requests across allowlisted repos.' },
    { key: 'list-issues', description: 'List issues across allowlisted repos.' },
    { key: 'open-pull', description: 'Open a new pull request.' },
  ],
  configSchema: githubConfigSchema,
  webhookKinds: ['github.pull_request', 'github.issues', 'github.push'],
  rateLimit: { rpm: 5000 },
});
