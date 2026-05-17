/**
 * Native-API tier base.
 *
 * Connectors that talk to first-party REST/JSON APIs directly
 * (no Nango, no scraper) extend this class. The base provides a
 * minimal `httpClient()` helper that subclasses can override to
 * inject upstream-specific auth/headers.
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

export interface HttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly body?: string | Buffer | undefined;
}

export interface HttpResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

export interface HttpClient {
  request(req: HttpRequest): Promise<HttpResponse>;
}

export abstract class NativeApiTier extends BaseTier {
  abstract override authenticate(instance: ConnectorInstance): Promise<AuthState>;
  abstract override sync(instance: ConnectorInstance, deps: SyncDeps): Promise<SyncResult>;
  override async handleWebhook(_event: WebhookEvent, _deps: WebhookDeps): Promise<void> {
    // Default: native-api connectors that don't support webhooks ignore.
  }

  protected httpClient(): HttpClient {
    return {
      async request(req: HttpRequest): Promise<HttpResponse> {
        const init: RequestInit = { method: req.method };
        if (req.headers) init.headers = new Headers(req.headers as Record<string, string>);
        if (req.body !== undefined) init.body = req.body as string | Uint8Array;
        const res = await fetch(req.url, init);
        const text = await res.text();
        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return { status: res.status, headers, body: text };
      },
    };
  }
}
