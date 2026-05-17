import { jsonRpcRequestSchema, MCP_ERRORS, SERVER_INFO, type JsonRpcResponse, type McpContext, type McpToolHandler } from './protocol.js';
import type { McpRateLimiter } from './rate-limit.js';

interface ServerDeps {
  tools: Map<string, McpToolHandler>;
  rateLimiter: McpRateLimiter;
  resolveContext: (request: unknown) => Promise<{ userId: string; workspaceId: string }>;
  logger?: { info(msg: string, data?: object): void; error(msg: string, data?: object): void };
}

export class McpServer {
  constructor(private deps: ServerDeps) {}

  async handle(rawMessage: string): Promise<string> {
    let request: unknown;
    try {
      request = JSON.parse(rawMessage);
    } catch {
      return this.encode(this.errorResponse(null, MCP_ERRORS.PARSE_ERROR, 'Parse error'));
    }

    const parsed = jsonRpcRequestSchema.safeParse(request);
    if (!parsed.success) {
      return this.encode(this.errorResponse(null, MCP_ERRORS.INVALID_REQUEST, parsed.error.message));
    }
    const req = parsed.data;
    const id = req.id ?? null;

    try {
      switch (req.method) {
        case 'initialize':
          return this.encode({
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: SERVER_INFO.protocolVersion,
              serverInfo: { name: SERVER_INFO.name, version: SERVER_INFO.version },
              capabilities: { tools: {} },
            },
          });
        case 'tools/list':
          return this.encode({
            jsonrpc: '2.0',
            id,
            result: { tools: Array.from(this.deps.tools.values()).map(t => t.definition) },
          });
        case 'tools/call': {
          const params = req.params ?? {};
          const name = String(params['name'] ?? '');
          const args = (params['arguments'] as Record<string, unknown>) ?? {};
          const tool = this.deps.tools.get(name);
          if (!tool) {
            return this.encode(this.errorResponse(id, MCP_ERRORS.METHOD_NOT_FOUND, `Unknown tool: ${name}`));
          }
          const { userId, workspaceId } = await this.deps.resolveContext(request);
          const rateCheck = this.deps.rateLimiter.check(userId);
          if (!rateCheck.allowed) {
            return this.encode(this.errorResponse(id, MCP_ERRORS.RATE_LIMITED, rateCheck.reason ?? 'Rate limited'));
          }
          const ctx: McpContext = { userId, workspaceId, requestId: id ?? 0 };
          const result = await tool.handler(args, ctx);
          return this.encode({ jsonrpc: '2.0', id, result });
        }
        case 'ping':
          return this.encode({ jsonrpc: '2.0', id, result: {} });
        default:
          return this.encode(this.errorResponse(id, MCP_ERRORS.METHOD_NOT_FOUND, `Unknown method: ${req.method}`));
      }
    } catch (err) {
      this.deps.logger?.error('mcp handler error', { err: err instanceof Error ? err.message : String(err) });
      return this.encode(this.errorResponse(id, MCP_ERRORS.INTERNAL_ERROR, err instanceof Error ? err.message : 'Internal error'));
    }
  }

  private errorResponse(id: string | number | null, code: number, message: string): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message } };
  }

  private encode(response: JsonRpcResponse): string {
    return JSON.stringify(response);
  }
}
