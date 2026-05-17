import type { McpToolHandler, McpContext, McpToolResult } from './protocol.js';

interface AgentBackend {
  query(workspaceId: string, userId: string, query: string): Promise<{ answer: string; citations?: string[] }>;
  proposeAction(workspaceId: string, userId: string, action: { kind: string; payload: Record<string, unknown> }): Promise<{ proposalId: string; status: string }>;
  updateMind(workspaceId: string, userId: string, section: string, key: string, value: unknown): Promise<{ accepted: boolean }>;
  listObjectives(workspaceId: string, userId: string): Promise<Array<{ id: string; title: string; status: string }>>;
  listInbox(workspaceId: string, userId: string, limit?: number): Promise<Array<{ id: string; kind: string; title: string; createdAt: string }>>;
  boundarySend(workspaceId: string, userId: string, params: { channel: string; target: string; body: string }): Promise<{ acted: boolean; requiresApproval: boolean; approvalId?: string }>;
}

export function createTools(backend: AgentBackend): Map<string, McpToolHandler> {
  const tools = new Map<string, McpToolHandler>();

  const queryTool: McpToolHandler = {
    definition: {
      name: 'tom.query',
      description: "Ask Tom a question about your context, ontology, objectives, or anything in your workspace.",
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The question to ask Tom' } },
        required: ['query'],
      },
    },
    handler: async (args, ctx) => {
      const query = String(args['query'] ?? '');
      const result = await backend.query(ctx.workspaceId, ctx.userId, query);
      const text = result.citations?.length
        ? `${result.answer}\n\nSources:\n${result.citations.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
        : result.answer;
      return { content: [{ type: 'text', text }] };
    },
  };

  const proposeTool: McpToolHandler = {
    definition: {
      name: 'tom.propose_action',
      description: 'Ask Tom to propose an action. Tom will create an approval request rather than acting directly.',
      inputSchema: {
        type: 'object',
        properties: { kind: { type: 'string' }, payload: { type: 'object' } },
        required: ['kind', 'payload'],
      },
    },
    handler: async (args, ctx): Promise<McpToolResult> => {
      const kind = String(args['kind'] ?? '');
      const payload = (args['payload'] as Record<string, unknown>) ?? {};
      const result = await backend.proposeAction(ctx.workspaceId, ctx.userId, { kind, payload });
      return { content: [{ type: 'text', text: `Proposal ${result.proposalId} status: ${result.status}` }] };
    },
  };

  const updateMindTool: McpToolHandler = {
    definition: {
      name: 'tom.update_mind',
      description: "Update a fact or preference in Tom's Mind. Goes through proposal/accept flow.",
      inputSchema: {
        type: 'object',
        properties: { section: { type: 'string' }, key: { type: 'string' }, value: {} },
        required: ['section', 'key', 'value'],
      },
    },
    handler: async (args, ctx): Promise<McpToolResult> => {
      const section = String(args['section'] ?? '');
      const key = String(args['key'] ?? '');
      const value = args['value'];
      const result = await backend.updateMind(ctx.workspaceId, ctx.userId, section, key, value);
      return { content: [{ type: 'text', text: result.accepted ? 'Mind update accepted' : 'Mind update pending review' }] };
    },
  };

  const objectivesTool: McpToolHandler = {
    definition: {
      name: 'tom.list_objectives',
      description: 'List your current objectives and OKRs.',
      inputSchema: { type: 'object', properties: {} },
    },
    handler: async (_args, ctx): Promise<McpToolResult> => {
      const objs = await backend.listObjectives(ctx.workspaceId, ctx.userId);
      const text = objs.length === 0
        ? 'No active objectives.'
        : objs.map(o => `- [${o.status}] ${o.title} (${o.id})`).join('\n');
      return { content: [{ type: 'text', text }] };
    },
  };

  const inboxTool: McpToolHandler = {
    definition: {
      name: 'tom.list_inbox',
      description: 'List items in your Tom inbox awaiting attention.',
      inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
    },
    handler: async (args, ctx): Promise<McpToolResult> => {
      const limit = typeof args['limit'] === 'number' ? args['limit'] : 20;
      const items = await backend.listInbox(ctx.workspaceId, ctx.userId, limit);
      const text = items.length === 0
        ? 'Inbox empty.'
        : items.map(i => `- [${i.kind}] ${i.title} (${i.createdAt})`).join('\n');
      return { content: [{ type: 'text', text }] };
    },
  };

  const boundarySendTool: McpToolHandler = {
    definition: {
      name: 'tom.boundary_send',
      description: 'Ask Tom to send a message outside (email, slack, etc.). Always requires approval at the configured autonomy level.',
      inputSchema: {
        type: 'object',
        properties: { channel: { type: 'string' }, target: { type: 'string' }, body: { type: 'string' } },
        required: ['channel', 'target', 'body'],
      },
    },
    handler: async (args, ctx): Promise<McpToolResult> => {
      const channel = String(args['channel'] ?? '');
      const target = String(args['target'] ?? '');
      const body = String(args['body'] ?? '');
      const result = await backend.boundarySend(ctx.workspaceId, ctx.userId, { channel, target, body });
      const text = result.acted
        ? 'Sent.'
        : result.requiresApproval
          ? `Approval required (id: ${result.approvalId})`
          : 'Pending.';
      return { content: [{ type: 'text', text }] };
    },
  };

  for (const t of [queryTool, proposeTool, updateMindTool, objectivesTool, inboxTool, boundarySendTool]) {
    tools.set(t.definition.name, t);
  }
  return tools;
}

export function createMockBackend(): AgentBackend {
  return {
    async query(_ws, _u, q) { return { answer: `Mock answer to: ${q}`, citations: ['mock-source-1'] }; },
    async proposeAction(_ws, _u, _a) { return { proposalId: 'mock-prop-1', status: 'pending' }; },
    async updateMind(_ws, _u, _s, _k, _v) { return { accepted: false }; },
    async listObjectives(_ws, _u) { return [{ id: 'obj-1', title: 'Q1 revenue', status: 'on_track' }]; },
    async listInbox(_ws, _u, _l) { return [{ id: 'inbox-1', kind: 'briefing', title: 'Daily brief', createdAt: new Date().toISOString() }]; },
    async boundarySend(_ws, _u, _p) { return { acted: false, requiresApproval: true, approvalId: 'appr-1' }; },
  };
}

export type { AgentBackend };
