/**
 * Gmail connector skeleton.
 *
 * Definition-only — no real API client. Concrete sync/webhook
 * implementations land in the worker package.
 */

import { defineConnector, z } from '@vita/connector-sdk';

export const gmailConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  accountEmail: z.string().email(),
  labels: z.array(z.string()).default([]),
});

export type GmailConfig = z.infer<typeof gmailConfigSchema>;

export const googleGmail = defineConnector<GmailConfig>({
  key: 'google-gmail',
  name: 'Gmail',
  description: 'Read and send mail through Gmail.',
  tier: 'oauth-nango',
  provider: 'google',
  scopes: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
  ],
  capabilities: [
    { key: 'read-messages', description: 'List and read Gmail threads/messages.' },
    { key: 'send-message', description: 'Send an outbound Gmail message.' },
    { key: 'watch-inbox', description: 'Receive push notifications for inbox changes.' },
  ],
  configSchema: gmailConfigSchema,
  webhookKinds: ['gmail.message.new', 'gmail.message.changed'],
  rateLimit: { rpm: 250 },
});
