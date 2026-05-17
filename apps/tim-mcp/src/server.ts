import { jsonRpcRequestSchema, MCP_ERRORS, SERVER_INFO, type JsonRpcResponse, type McpContext, type McpToolHandler, type McpToolResult } from './protocol.js';

export interface RateLimitConfig { rpm: number; dailyCostCapCents: number }
interface UserBucket { windowStart: number; count: number; dailyCostCents: number; dayStart: number }

export class McpRateLimiter {
  private buckets = new Map<string, UserBucket>();
  constructor(private config: RateLimitConfig = { rpm: 60, dailyCostCapCents: 5000 }) {}
  check(userId: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const dayMs = 86400000, winMs = 60000;
    let b = this.buckets.get(userId);
    if (!b) { b = { windowStart: now, count: 0, dailyCostCents: 0, dayStart: now }; this.buckets.set(userId, b); }
    if (now - b.windowStart > winMs) { b.windowStart = now; b.count = 0; }
    if (now - b.dayStart > dayMs) { b.dayStart = now; b.dailyCostCents = 0; }
    if (b.count >= this.config.rpm) return { allowed: false, reason: `Rate limit: ${this.config.rpm} rpm` };
    if (b.dailyCostCents >= this.config.dailyCostCapCents) return { allowed: false, reason: 'Daily cost cap' };
    b.count++;
    return { allowed: true };
  }
  recordCost(userId: string, c: number): void {
    let b = this.buckets.get(userId);
    if (!b) { const now = Date.now(); b = { windowStart: now, count: 0, dailyCostCents: 0, dayStart: now }; this.buckets.set(userId, b); }
    b.dailyCostCents += c;
  }
}

export interface TimBackend {
  query(workspaceId: string, query: string): Promise<{ answer: string; citations?: string[] }>;
  listObjectives(workspaceId: string): Promise<Array<{ id: string; title: string; status: string; owner?: string }>>;
  proposeTeamUpdate(workspaceId: string, userId: string, section: string, content: unknown): Promise<{ proposalId: string; routedToTom: string[] }>;
  getTeamBrief(workspaceId: string): Promise<{ summary: string; focus: string[]; blockers: string[] }>;
  listMembers(workspaceId: string): Promise<Array<{ userId: string; name: string; focus?: string }>>;
}

export function createMockTimBackend(): TimBackend {
  return {
    async query(_ws, q) { return { answer: `Tim mock answer to: ${q}` }; },
    async listObjectives(_ws) { return [{ id: 'okr-1', title: 'Q1 team velocity', status: 'on_track' }]; },
    async proposeTeamUpdate(_ws, _u, _s, _c) { return { proposalId: 'tim-prop-1', routedToTom: ['user-a-tom'] }; },
    async getTeamBrief(_ws) { return { summary: 'Team is on track', focus: ['Q1 launch'], blockers: [] }; },
    async listMembers(_ws) { return [{ userId: 'u1', name: 'Alice', focus: 'API design' }]; },
  };
}

export function createTimTools(backend: TimBackend): Map<string, McpToolHandler> {
  const tools = new Map<string, McpToolHandler>();

  tools.set('tim.query', {
    definition: { name: 'tim.query', description: "Ask Tim about the team's context", inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    handler: async (args, ctx): Promise<McpToolResult> => {
      const r = await backend.query(ctx.workspaceId, String(args['query'] ?? ''));
      return { content: [{ type: 'text', text: r.answer }] };
    },
  });

  tools.set('tim.list_objectives', {
    definition: { name: 'tim.list_objectives', description: 'List team OKRs', inputSchema: { type: 'object', properties: {} } },
    handler: async (_args, ctx): Promise<McpToolResult> => {
      const objs = await backend.listObjectives(ctx.workspaceId);
      const text = objs.length === 0 ? 'No team objectives.' : objs.map(o => `- [${o.status}] ${o.title}${o.owner ? ` (${o.owner})` : ''}`).join('\n');
      return { content: [{ type: 'text', text }] };
    },
  });

  tools.set('tim.propose_update', {
    definition: { name: 'tim.propose_update', description: "Propose a team-level update; routes through relevant person's Tom", inputSchema: { type: 'object', properties: { section: { type: 'string' }, content: {} }, required: ['section', 'content'] } },
    handler: async (args, ctx): Promise<McpToolResult> => {
      const r = await backend.proposeTeamUpdate(ctx.workspaceId, ctx.userId, String(args['section'] ?? ''), args['content']);
      return { content: [{ type: 'text', text: `Proposal ${r.proposalId} routed to ${r.routedToTom.length} Toms` }] };
    },
  });

  tools.set('tim.team_brief', {
    definition: { name: 'tim.team_brief', description: 'Get the latest team brief', inputSchema: { type: 'object', properties: {} } },
    handler: async (_args, ctx): Promise<McpToolResult> => {
      const b = await backend.getTeamBrief(ctx.workspaceId);
      const lines = [b.summary, `Focus: ${b.focus.join(', ') || '(none)'}`, `Blockers: ${b.blockers.join(', ') || '(none)'}`];
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    },
  });

  tools.set('tim.list_members', {
    definition: { name: 'tim.list_members', description: 'List workspace members and current focus', inputSchema: { type: 'object', properties: {} } },
    handler: async (_args, ctx): Promise<McpToolResult> => {
      const members = await backend.listMembers(ctx.workspaceId);
      const text = members.map(m => `- ${m.name}${m.focus ? ` — ${m.focus}` : ''}`).join('\n');
      return { content: [{ type: 'text', text: text || 'No members.' }] };
    },
  });

  return tools;
}

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
    try { request = JSON.parse(rawMessage); }
    catch { return this.encode(this.errorResponse(null, MCP_ERRORS.PARSE_ERROR, 'Parse error')); }

    const parsed = jsonRpcRequestSchema.safeParse(request);
    if (!parsed.success) return this.encode(this.errorResponse(null, MCP_ERRORS.INVALID_REQUEST, parsed.error.message));
    const req = parsed.data;
    const id = req.id ?? null;

    try {
      switch (req.method) {
        case 'initialize':
          return this.encode({ jsonrpc: '2.0', id, result: { protocolVersion: SERVER_INFO.protocolVersion, serverInfo: { name: SERVER_INFO.name, version: SERVER_INFO.version }, capabilities: { tools: {} } } });
        case 'tools/list':
          return this.encode({ jsonrpc: '2.0', id, result: { tools: Array.from(this.deps.tools.values()).map(t => t.definition) } });
        case 'tools/call': {
          const params = req.params ?? {};
          const name = String(params['name'] ?? '');
          const args = (params['arguments'] as Record<string, unknown>) ?? {};
          const tool = this.deps.tools.get(name);
          if (!tool) return this.encode(this.errorResponse(id, MCP_ERRORS.METHOD_NOT_FOUND, `Unknown tool: ${name}`));
          const { userId, workspaceId } = await this.deps.resolveContext(request);
          const rateCheck = this.deps.rateLimiter.check(userId);
          if (!rateCheck.allowed) return this.encode(this.errorResponse(id, MCP_ERRORS.RATE_LIMITED, rateCheck.reason ?? 'Rate limited'));
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

  private encode(r: JsonRpcResponse): string { return JSON.stringify(r); }
}
