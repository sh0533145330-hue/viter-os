import { describe, it, expect } from 'vitest';
import { McpServer } from '../server.js';
import { McpRateLimiter } from '../rate-limit.js';
import { createMockBackend, createTools } from '../tools.js';

function makeServer() {
  const backend = createMockBackend();
  const tools = createTools(backend);
  const rateLimiter = new McpRateLimiter({ rpm: 100, dailyCostCapCents: 100000 });
  return new McpServer({
    tools,
    rateLimiter,
    resolveContext: async () => ({ userId: 'test-user', workspaceId: 'test-ws' }),
  });
}

describe('McpServer', () => {
  it('responds to initialize', async () => {
    const server = makeServer();
    const res = JSON.parse(await server.handle(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' })));
    expect(res.id).toBe(1);
    expect(res.result.protocolVersion).toBe('2024-11-05');
    expect(res.result.serverInfo.name).toBe('tom-mcp');
  });

  it('lists tools', async () => {
    const server = makeServer();
    const res = JSON.parse(await server.handle(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })));
    expect(Array.isArray(res.result.tools)).toBe(true);
    expect(res.result.tools.length).toBe(6);
    const names = res.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain('tom.query');
    expect(names).toContain('tom.boundary_send');
  });

  it('calls tom.query tool', async () => {
    const server = makeServer();
    const res = JSON.parse(await server.handle(JSON.stringify({
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'tom.query', arguments: { query: 'What is my next meeting?' } }
    })));
    expect(res.result.content[0].text).toContain('Mock answer to');
  });

  it('returns error for unknown tool', async () => {
    const server = makeServer();
    const res = JSON.parse(await server.handle(JSON.stringify({
      jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'unknown.tool', arguments: {} }
    })));
    expect(res.error.code).toBe(-32601);
  });

  it('handles parse errors', async () => {
    const server = makeServer();
    const res = JSON.parse(await server.handle('not json'));
    expect(res.error.code).toBe(-32700);
  });

  it('responds to ping', async () => {
    const server = makeServer();
    const res = JSON.parse(await server.handle(JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'ping' })));
    expect(res.id).toBe(5);
    expect(res.result).toEqual({});
  });

  it('returns method not found', async () => {
    const server = makeServer();
    const res = JSON.parse(await server.handle(JSON.stringify({ jsonrpc: '2.0', id: 6, method: 'unknown' })));
    expect(res.error.code).toBe(-32601);
  });
});
