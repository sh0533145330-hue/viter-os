/**
 * MCP-client tier base.
 *
 * Connectors that consume a Model Context Protocol server extend
 * this class. The base abstracts the MCP client lifecycle so
 * subclasses just declare which MCP server (URL + auth) to use.
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

export interface McpTool {
  readonly name: string;
  readonly description: string;
}

export interface McpResource {
  readonly uri: string;
  readonly mimeType?: string | undefined;
}

export interface McpClient {
  listTools(): Promise<McpTool[]>;
  listResources(): Promise<McpResource[]>;
  callTool(name: string, args: unknown): Promise<unknown>;
  close(): Promise<void>;
}

export interface McpClientProvider {
  connect(endpoint: string, token?: string | undefined): Promise<McpClient>;
}

export abstract class MCPClientTier extends BaseTier {
  abstract override sync(instance: ConnectorInstance, deps: SyncDeps): Promise<SyncResult>;

  override async authenticate(_instance: ConnectorInstance): Promise<AuthState> {
    return { authenticated: true };
  }

  override async handleWebhook(_event: WebhookEvent, _deps: WebhookDeps): Promise<void> {
    // MCP is request/response only; webhooks not applicable by default.
  }

  protected abstract mcpProvider(): McpClientProvider;
  protected abstract endpoint(instance: ConnectorInstance): string;
}
