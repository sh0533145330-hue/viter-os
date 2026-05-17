/**
 * `@vita/connectors-builtin` — built-in connector definitions.
 *
 * Definition-only skeletons. Concrete tier implementations (HTTP
 * clients, browser automation, MCP transports) live in workers
 * outside this OSS surface.
 */

import type { ConnectorDefinition } from '@vita/connector-sdk';

export { googleGmail, gmailConfigSchema, type GmailConfig } from './google-gmail.js';
export {
  googleCalendar,
  googleCalendarConfigSchema,
  type GoogleCalendarConfig,
} from './google-calendar.js';
export { googleDrive, googleDriveConfigSchema, type GoogleDriveConfig } from './google-drive.js';
export {
  microsoftOutlook,
  microsoftOutlookConfigSchema,
  type MicrosoftOutlookConfig,
} from './microsoft-outlook.js';
export { slack, slackConfigSchema, type SlackConfig } from './slack.js';
export { notion, notionConfigSchema, type NotionConfig } from './notion.js';
export { linear, linearConfigSchema, type LinearConfig } from './linear.js';
export { github, githubConfigSchema, type GithubConfig } from './github.js';
export { hubspot, hubspotConfigSchema, type HubspotConfig } from './hubspot.js';
export { salesforce, salesforceConfigSchema, type SalesforceConfig } from './salesforce.js';
export { quickbooks, quickbooksConfigSchema, type QuickbooksConfig } from './quickbooks.js';
export { stripe, stripeConfigSchema, type StripeConfig } from './stripe.js';

import { github } from './github.js';
import { googleCalendar } from './google-calendar.js';
import { googleDrive } from './google-drive.js';
import { googleGmail } from './google-gmail.js';
import { hubspot } from './hubspot.js';
import { linear } from './linear.js';
import { microsoftOutlook } from './microsoft-outlook.js';
import { notion } from './notion.js';
import { quickbooks } from './quickbooks.js';
import { salesforce } from './salesforce.js';
import { slack } from './slack.js';
import { stripe } from './stripe.js';

export const builtinConnectors: readonly ConnectorDefinition[] = [
  googleGmail,
  googleCalendar,
  googleDrive,
  microsoftOutlook,
  slack,
  notion,
  linear,
  github,
  hubspot,
  salesforce,
  quickbooks,
  stripe,
];

export const VERSION = '1.0.0-rc.0';
