import { z } from 'zod';

export const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
});

export type JsonRpcRequest = z.infer<typeof jsonRpcRequestSchema>;

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
}

export interface McpToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface McpContext {
  userId: string;
  workspaceId: string;
  requestId: string | number;
}

export interface McpToolHandler {
  definition: McpToolDefinition;
  handler: (args: Record<string, unknown>, ctx: McpContext) => Promise<McpToolResult>;
}

export const MCP_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  RATE_LIMITED: -32001,
  UNAUTHORIZED: -32002,
} as const;

export const SERVER_INFO = {
  name: 'tim-mcp',
  version: '0.0.1',
  protocolVersion: '2024-11-05',
} as const;
