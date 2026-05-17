import { defineConnector, z } from '@vita/connector-sdk';

export const googleCalendarConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  calendarIds: z.array(z.string()).default(['primary']),
});

export type GoogleCalendarConfig = z.infer<typeof googleCalendarConfigSchema>;

export const googleCalendar = defineConnector<GoogleCalendarConfig>({
  key: 'google-calendar',
  name: 'Google Calendar',
  description: 'Read and manage Google Calendar events.',
  tier: 'oauth-nango',
  provider: 'google',
  scopes: ['https://www.googleapis.com/auth/calendar'],
  capabilities: [
    { key: 'list-events', description: 'List upcoming events on a calendar.' },
    { key: 'create-event', description: 'Create a new calendar event.' },
    { key: 'list-calendars', description: 'List calendars on the account.' },
  ],
  configSchema: googleCalendarConfigSchema,
  webhookKinds: ['calendar.event.changed'],
  rateLimit: { rpm: 500 },
});
