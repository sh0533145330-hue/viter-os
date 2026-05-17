/**
 * Tier-base abstractions consumed by every concrete connector.
 *
 * Each tier subclass pre-wires the shared concerns for that
 * transport (OAuth refresh for Nango, HTTP scaffolding for native
 * APIs, browser session lifecycle for scrapers, etc.) so connector
 * authors can focus on the upstream-specific shape.
 */

import type {
  AuthState,
  ConnectorInstance,
  SyncDeps,
  SyncResult,
  WebhookDeps,
  WebhookEvent,
} from '../types.js';

export abstract class BaseTier {
  abstract authenticate(instance: ConnectorInstance): Promise<AuthState>;
  abstract sync(instance: ConnectorInstance, deps: SyncDeps): Promise<SyncResult>;
  abstract handleWebhook(event: WebhookEvent, deps: WebhookDeps): Promise<void>;
}

export type { AuthState, ConnectorInstance, SyncDeps, SyncResult, WebhookEvent } from '../types.js';
