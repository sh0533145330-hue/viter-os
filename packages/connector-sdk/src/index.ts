/**
 * `@vita/connector-sdk` — connector authoring SDK.
 *
 * Public OSS surface (MIT) used by every native, OAuth, MCP,
 * scraper, voice, and file/email connector on the platform. The
 * package exposes `defineConnector`, six tier base classes, the
 * registry, the webhook framework, rate-limit + retry primitives,
 * and the scraper playbook DSL.
 */

export { z } from 'zod';

export {
  defineConnector,
  type ConnectorCapability,
  type ConnectorDefinition,
  type ConnectorRateLimit,
  type InferConnectorConfig,
} from './connector.js';

export {
  ConnectorRegistry,
  createConnectorRegistry,
  type RegistryFilter,
} from './registry.js';

export { BaseTier } from './tiers/base.js';
export {
  NativeApiTier,
  type HttpClient,
  type HttpRequest,
  type HttpResponse,
} from './tiers/native-api.js';
export {
  NangoOAuthTier,
  type NangoClient,
  type NangoConnection,
} from './tiers/oauth-nango.js';
export {
  ScraperTier,
  type BrowserProvider,
  type BrowserSession,
} from './tiers/scraper.js';
export {
  VoiceChannelTier,
  type VoiceTranscript,
} from './tiers/voice-channel.js';
export {
  MCPClientTier,
  type McpClient,
  type McpClientProvider,
  type McpResource,
  type McpTool,
} from './tiers/mcp-client.js';
export {
  FileEmailTier,
  type DroppedItem,
} from './tiers/file-email.js';

export {
  base64UrlEncode,
  buildAuthorizationUrl,
  generateOAuthState,
  generatePkcePair,
  type AuthorizationUrlParams,
  type PkceChallenge,
} from './auth.js';

export {
  parseGithubSignature,
  parseSlackSignature,
  parseStripeSignature,
  verifyHmacSignature,
  WebhookReplayCache,
  type GithubSignatureParams,
  type HmacScheme,
  type SlackSignatureParams,
  type StripeSignatureParams,
  type VerifyHmacParams,
} from './webhook.js';

export {
  getRateLimiter,
  RateLimiterRegistry,
  resetRateLimiters,
  TokenBucket,
  type TokenBucketOptions,
} from './ratelimit.js';

export { retry, type RetryOptions } from './retry.js';

export {
  definePlaybook,
  type ScraperPlaybook,
  type ScraperStep,
} from './playbook.js';

export type {
  AuthState,
  ConnectorInstance,
  ConnectorStatus,
  ConnectorTier,
  L0IngestRequest,
  Logger,
  RateLimiter,
  SyncDeps,
  SyncResult,
  WebhookDeps,
  WebhookEvent,
} from './types.js';

export const VERSION = '1.0.0-rc.0';
