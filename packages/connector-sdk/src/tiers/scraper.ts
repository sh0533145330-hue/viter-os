/**
 * Browser-scraper tier base (Browserbase).
 *
 * Connectors backed by headless browser automation extend this
 * class. The base exposes the playbook DSL hooks needed to drive
 * a Browserbase session; the concrete browser provider is injected
 * by the host runtime.
 */

import { BaseTier } from './base.js';
import type { ScraperPlaybook } from '../playbook.js';
import type {
  AuthState,
  ConnectorInstance,
  SyncDeps,
  SyncResult,
  WebhookDeps,
  WebhookEvent,
} from '../types.js';

export interface BrowserSession {
  goto(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  waitFor(selector: string, timeoutMs?: number): Promise<void>;
  extract(selector: string, attribute?: string, multiple?: boolean): Promise<string | string[]>;
  screenshot(): Promise<Buffer>;
  close(): Promise<void>;
}

export interface BrowserProvider {
  open(opts?: { profile?: string | undefined }): Promise<BrowserSession>;
}

export abstract class ScraperTier extends BaseTier {
  abstract override authenticate(instance: ConnectorInstance): Promise<AuthState>;
  abstract override sync(instance: ConnectorInstance, deps: SyncDeps): Promise<SyncResult>;

  override async handleWebhook(_event: WebhookEvent, _deps: WebhookDeps): Promise<void> {
    // Scrapers do not handle inbound webhooks by default.
  }

  protected abstract browserProvider(): BrowserProvider;
  protected abstract playbook(instance: ConnectorInstance): ScraperPlaybook;
}
