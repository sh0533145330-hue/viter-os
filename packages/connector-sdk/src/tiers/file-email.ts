/**
 * File / email-ingest tier base.
 *
 * Universal-fallback connectors that ingest binary blobs (uploaded
 * files, forwarded emails) extend this class. The base contract
 * exposes a `parseDropped` hook so authors can map raw payloads to
 * L0 ingest requests.
 */

import { BaseTier } from './base.js';
import type {
  AuthState,
  ConnectorInstance,
  L0IngestRequest,
  SyncDeps,
  SyncResult,
  WebhookDeps,
  WebhookEvent,
} from '../types.js';

export interface DroppedItem {
  readonly source: 'file' | 'email';
  readonly filename?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly size: number;
  readonly content: Buffer;
  readonly metadata?: Record<string, unknown> | undefined;
}

export abstract class FileEmailTier extends BaseTier {
  abstract override handleWebhook(event: WebhookEvent, deps: WebhookDeps): Promise<void>;

  override async authenticate(_instance: ConnectorInstance): Promise<AuthState> {
    return { authenticated: true };
  }

  override async sync(_instance: ConnectorInstance, _deps: SyncDeps): Promise<SyncResult> {
    // File/email ingest is push-only by default.
    return { ingested: 0, skipped: 0, fullySynced: true };
  }

  protected abstract parseDropped(
    instance: ConnectorInstance,
    item: DroppedItem,
  ): Promise<L0IngestRequest[]>;
}
