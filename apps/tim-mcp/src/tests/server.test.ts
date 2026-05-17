import { describe, it, expect } from 'vitest';
import { McpServer, McpRateLimiter, createTimTools, createMockTimBackend } from '../server.js';

function makeServer() {
  const tools = createTimTools(createMockTimBackend());
  const rl = new McpRateLimiter({ rpm: 100, dailyCostCapCents: 100000 });
  return new McpServer({ tools, rateLimiter: rl, resolveContext: async () => ({ userId: 'u1', workspaceId: 'ws1' }) });
}

describe('Tim MCP Server', () => {
  it('initializes with tim-mcp identity', async () => {
    const s = makeServer();
    const res = JSON.parse(await s.handle(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' })));
    expect(res.result.serverInfo.name).toBe('tim-mcp');
  });

  it('lists Tim tools', async () => {
    const s = makeServer();
    const res = JSON.parse(await s.handle(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })));
    const names = res.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain('tim.query');
    expect(names).toContain('tim.team_brief');
    expect(names).toContain('tim.list_members');
  });

  it('calls tim.team_brief', async () => {
    const s = makeServer();
    const res = JSON.parse(await s.handle(JSON.stringify({
      jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'tim.team_brief', arguments: {} }
    })));
    expect(res.result.content[0].text).toContain('Team is on track');
  });

  it('calls tim.propose_update', async () => {
    const s = makeServer();
    const res = JSON.parse(await s.handle(JSON.stringify({
      jsonrpc: '2.0', id: 4, method: 'tools/call',
      params: { name: 'tim.propose_update', arguments: { section: 'okrs', content: { kr: 'updated' } } }
    })));
    expect(res.result.content[0].text).toContain('routed to');
  });

  it('rate limits exceeded users', async () => {
    const tools = createTimTools(createMockTimBackend());
    const rl = new McpRateLimiter({ rpm: 1, dailyCostCapCents: 100000 });
    const s = new McpServer({ tools, rateLimiter: rl, resolveContext: async () => ({ userId: 'u1', workspaceId: 'ws1' }) });
    await s.handle(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'tim.query', arguments: { query: 'a' } } }));
    const res = JSON.parse(await s.handle(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'tim.query', arguments: { query: 'b' } } })));
    expect(res.error.code).toBe(-32001);
  });
});
