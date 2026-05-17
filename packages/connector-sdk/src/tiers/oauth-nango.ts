/**
 * OAuth (Nango self-hosted) tier base.
 *
 * Connectors authenticated through a hosted Nango instance extend
 * this class. The base abstracts the Nango connection lookup so
 * subclasses can request access tokens without ever touching the
 * raw OAuth dance.
 */

import { BaseTier } from './base.js';
import type {
  AuthState,
  ConnectorInstance,
  SyncDeps,
  SyncResult,
  WebhookDeps,
  WebhookEvent,
} from '../types.js';

export interface NangoConnection {
  readonly connectionId: string;
  readonly providerConfigKey: string;
  readonly accessToken: string;
  readonly refreshToken?: string | undefined;
  readonly expiresAt?: Date | undefined;
  readonly scopes?: readonly string[] | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface NangoClient {
  getConnection(providerConfigKey: string, connectionId: string): Promise<NangoConnection>;
}

export abstract class NangoOAuthTier extends BaseTier {
  abstract override sync(instance: ConnectorInstance, deps: SyncDeps): Promise<SyncResult>;

  override async authenticate(instance: ConnectorInstance): Promise<AuthState> {
    const conn = await this.getConnection(instance);
    return {
      authenticated: true,
      ...(conn.expiresAt !== undefined ? { expiresAt: conn.expiresAt } : {}),
      ...(conn.scopes !== undefined ? { scopes: conn.scopes } : {}),
    };
  }

  override async handleWebhook(_event: WebhookEvent, _deps: WebhookDeps): Promise<void> {
    // Subclasses may override; default is a no-op.
  }

  protected abstract nangoClient(): NangoClient;

  protected async getConnection(instance: ConnectorInstance): Promise<NangoConnection> {
    const cfg = instance.config as { providerConfigKey?: string; connectionId?: string };
    if (!cfg.providerConfigKey || !cfg.connectionId) {
      throw new Error(
        `Connector instance '${instance.id}' missing providerConfigKey/connectionId in config`,
      );
    }
    return this.nangoClient().getConnection(cfg.providerConfigKey, cfg.connectionId);
  }
}
