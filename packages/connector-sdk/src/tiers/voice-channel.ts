/**
 * Voice-channel tier base.
 *
 * Connectors that ingest live voice (calls, meetings, dial-in
 * lines) extend this class. The base contract is sync-pull friendly
 * but expects most authors to handle webhooks/streaming.
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

export interface VoiceTranscript {
  readonly callId: string;
  readonly startedAt: Date;
  readonly endedAt?: Date | undefined;
  readonly segments: readonly { speaker: string; text: string; at: Date }[];
}

export abstract class VoiceChannelTier extends BaseTier {
  abstract override authenticate(instance: ConnectorInstance): Promise<AuthState>;
  abstract override handleWebhook(event: WebhookEvent, deps: WebhookDeps): Promise<void>;

  override async sync(_instance: ConnectorInstance, _deps: SyncDeps): Promise<SyncResult> {
    // Voice connectors are typically push-only; default sync is a no-op.
    return { ingested: 0, skipped: 0, fullySynced: true };
  }

  protected abstract parseTranscript(rawBody: Buffer | string): VoiceTranscript;
}
