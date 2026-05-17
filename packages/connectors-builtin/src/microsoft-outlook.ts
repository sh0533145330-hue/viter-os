import { defineConnector, z } from '@vita/connector-sdk';

export const microsoftOutlookConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  mailbox: z.string().email(),
});

export type MicrosoftOutlookConfig = z.infer<typeof microsoftOutlookConfigSchema>;

export const microsoftOutlook = defineConnector<MicrosoftOutlookConfig>({
  key: 'microsoft-outlook',
  name: 'Outlook',
  description: 'Read and send mail through Microsoft Outlook / Graph.',
  tier: 'oauth-nango',
  provider: 'microsoft',
  scopes: ['Mail.ReadWrite', 'Mail.Send', 'Calendars.ReadWrite'],
  capabilities: [
    { key: 'read-messages', description: 'Read messages from the Outlook mailbox.' },
    { key: 'send-message', description: 'Send an outbound message.' },
    { key: 'list-events', description: 'List events on the linked calendar.' },
  ],
  configSchema: microsoftOutlookConfigSchema,
  webhookKinds: ['outlook.message.new', 'outlook.event.changed'],
  rateLimit: { rpm: 240 },
});
