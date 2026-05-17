import { defineConnector, z } from '@vita/connector-sdk';

export const googleDriveConfigSchema = z.object({
  providerConfigKey: z.string().min(1),
  connectionId: z.string().min(1),
  rootFolderId: z.string().optional(),
  includeShared: z.boolean().default(false),
});

export type GoogleDriveConfig = z.infer<typeof googleDriveConfigSchema>;

export const googleDrive = defineConnector<GoogleDriveConfig>({
  key: 'google-drive',
  name: 'Google Drive',
  description: 'Browse and ingest files from Google Drive.',
  tier: 'oauth-nango',
  provider: 'google',
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  capabilities: [
    { key: 'list-files', description: 'List files under a Drive folder.' },
    { key: 'fetch-file', description: 'Fetch the binary contents of a Drive file.' },
  ],
  configSchema: googleDriveConfigSchema,
  webhookKinds: ['drive.file.changed'],
  rateLimit: { rpm: 1000 },
});
