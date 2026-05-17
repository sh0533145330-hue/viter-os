/**
 * Shared types for `@vita/connector-sdk`.
 *
 * Public OSS surface — every shape consumed by connector authors,
 * the registry, the webhook receiver, and the sync workers lives
 * here. Keep this module free of runtime imports so it can be
 * picked up by lightweight consumers.
 */

export type ConnectorTier =
  | 'native-api'
  | 'oauth-nango'
  | 'scraper'
  | 'voice-channel'
  | 'mcp-client'
  | 'file-email';

export type ConnectorStatus = 'active' | 'paused' | 'error' | 'reauth_required';

export interface Logger {
  info(msg: string, data?: object): void;
  warn(msg: string, data?: object): void;
  error(msg: string, data?: object): void;
  debug?(msg: string, data?: object): void;
}

export interface ConnectorInstance<TConfig = Record<string, unknown>> {
  readonly id: string;
  readonly workspaceId: string;
  readonly connectorKey: string;
  readonly config: TConfig;
  readonly credentialsRef: string;
  readonly status: ConnectorStatus;
  readonly cursor?: Record<string, unknown> | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface AuthState {
  readonly authenticated: boolean;
  readonly expiresAt?: Date | undefined;
  readonly scopes?: readonly string[] | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface L0IngestRequest {
  readonly workspaceId: string;
  readonly connectorInstanceId: string;
  readonly kind: string;
  readonly source: string;
  readonly externalId?: string | undefined;
  readonly occurredAt?: Date | undefined;
  readonly payload: Record<string, unknown>;
  readonly contentHash?: string | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface SyncResult {
  readonly ingested: number;
  readonly skipped: number;
  readonly nextCursor?: Record<string, unknown> | undefined;
  readonly fullySynced: boolean;
  readonly errors?: readonly string[] | undefined;
}

export interface WebhookEvent {
  readonly id: string;
  readonly connectorInstanceId: string;
  readonly receivedAt: Date;
  readonly kind: string;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly rawBody: Buffer | string;
  readonly parsed?: unknown;
}

export interface RateLimiter {
  tryConsume(n?: number): boolean;
  waitForToken(n?: number): Promise<void>;
  readonly capacity: number;
  readonly available: number;
}

export interface SyncDeps {
  readonly logger: Logger;
  readonly abortSignal: AbortSignal;
  readonly rateLimit: RateLimiter;
  readonly fetchSecret: (ref: string) => Promise<unknown>;
  readonly l0Ingest: (artifact: L0IngestRequest) => Promise<{ id: string }>;
}

export interface WebhookDeps {
  readonly logger: Logger;
  readonly l0Ingest: (artifact: L0IngestRequest) => Promise<{ id: string }>;
  readonly fetchSecret: (ref: string) => Promise<unknown>;
}
