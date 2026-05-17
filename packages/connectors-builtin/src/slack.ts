import { defineConnector, z } from '@vita/connector-sdk';

export const slackConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  teamId: z.string().min(1),
  channelAllowlist: z.array(z.string()).default([]),
});

export type SlackConfig = z.infer<typeof slackConfigSchema>;

export const slack = defineConnector<SlackConfig>({
  key: 'slack',
  name: 'Slack',
  description: 'Read and post messages in Slack channels and DMs.',
  tier: 'oauth-nango',
  provider: 'slack',
  scopes: ['channels:history', 'channels:read', 'chat:write', 'im:history', 'users:read'],
  capabilities: [
    { key: 'read-messages', description: 'Read messages in subscribed channels.' },
    { key: 'send-message', description: 'Post a message to a channel or user.' },
    { key: 'list-channels', description: 'List channels in the workspace.' },
  ],
  configSchema: slackConfigSchema,
  webhookKinds: ['slack.event.message', 'slack.event.app_mention', 'slack.event.reaction_added'],
  rateLimit: { rpm: 60 },
});
