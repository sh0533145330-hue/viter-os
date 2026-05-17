import { PolicyDeniedError, createSkillRegistry, defineSkill } from '@vita/core';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineAgent } from '../agent.js';
import { StaticAutonomyResolver } from '../autonomy.js';
import { InMemoryBoundaryActStore, TomOnlyBoundaryGuard } from '../boundary.js';
import { createMockProvider } from '../model-providers.js';
import { registerPrompt } from '../prompt.js';
import { AgentRuntime } from '../runtime.js';
import type { Logger } from '../types.js';

const silentLogger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

function makeRuntime(opts: {
  responseText?: string;
  costCents?: number;
  store?: InMemoryBoundaryActStore;
}) {
  const registry = createSkillRegistry();
  registry.register(
    defineSkill({
      key: 'lookup',
      schema: z.object({ q: z.string() }),
      returns: z.object({ a: z.string() }),
      description: 'lookup',
      handler: async () => ({ a: 'x' }),
    }),
  );
  const provider = createMockProvider({
    ...(opts.responseText !== undefined ? { responseText: opts.responseText } : {}),
    ...(opts.costCents !== undefined ? { costCents: opts.costCents } : {}),
  });
  const store = opts.store ?? new InMemoryBoundaryActStore();
  const runtime = new AgentRuntime({
    modelProvider: provider,
    skillRegistry: registry,
    boundaryGuard: new TomOnlyBoundaryGuard(store),
    autonomy: new StaticAutonomyResolver('draft_confirm'),
    logger: silentLogger,
  });
  return { runtime, registry, store };
}

const tom = defineAgent({
  key: 'tom',
  kind: 'boundary',
  requiresBoundary: true,
  description: 'Tom',
  inputs: z.object({ instruction: z.string() }),
  outputs: z.object({ reply: z.string() }),
  promptRef: registerPrompt({
    id: 'inline:tom-test',
    body: 'You are Tom for {{ workspaceId }}.',
    variables: ['workspaceId'],
  }),
  model: 'mock-1',
  tools: ['lookup'],
  autonomy: { default: 'draft_confirm', max: 'auto_with_veto' },
  version: 1,
});

const tim = defineAgent({
  key: 'tim',
  kind: 'team',
  requiresBoundary: false,
  description: 'Tim',
  inputs: z.object({ instruction: z.string() }),
  outputs: z.object({ reply: z.string() }),
  promptRef: registerPrompt({
    id: 'inline:tim-test',
    body: 'You are Tim.',
    variables: [],
  }),
  model: 'mock-1',
  tools: [],
  autonomy: { default: 'draft_confirm', max: 'auto_with_limits' },
  version: 1,
});

describe('AgentRuntime', () => {
  it('runs a non-boundary agent', async () => {
    const { runtime } = makeRuntime({ responseText: JSON.stringify({ reply: 'hi' }) });
    const ctrl = new AbortController();
    const res = await runtime.invoke(
      tim,
      { instruction: 'hello' },
      { workspaceId: 'ws', userId: 'u1', abort: ctrl.signal },
    );
    expect(res.output).toEqual({ reply: 'hi' });
    expect(res.autonomyLevel).toBeUndefined();
  });

  it('records a Tom boundary act after a successful response', async () => {
    const store = new InMemoryBoundaryActStore();
    const { runtime } = makeRuntime({
      responseText: JSON.stringify({ reply: 'sent' }),
      store,
    });
    const ctrl = new AbortController();
    const res = await runtime.invoke(
      tom,
      { instruction: 'send the deck' },
      { workspaceId: 'ws', userId: 'u1', abort: ctrl.signal },
      {
        promptVars: { workspaceId: 'ws' },
        boundary: {
          actKind: 'email.send',
          target: 'mailto:client@example.com',
          payload: { subject: 'Deck' },
        },
      },
    );
    expect(res.output).toEqual({ reply: 'sent' });
    expect(res.autonomyLevel).toBe('draft_confirm');
    const acts = store.list();
    expect(acts).toHaveLength(1);
    const [act] = acts;
    expect(act).toBeDefined();
    if (act) {
      expect(act.agentKey).toBe('tom');
      expect(act.actKind).toBe('email.send');
      expect(act.promptHash).toBe(res.promptHash);
    }
  });

  it('rejects boundary acts from non-boundary agents', async () => {
    const { runtime } = makeRuntime({ responseText: JSON.stringify({ reply: 'no' }) });
    const ctrl = new AbortController();
    await expect(
      runtime.invoke(
        tim,
        { instruction: 'leak' },
        { workspaceId: 'ws', userId: 'u1', abort: ctrl.signal },
        { boundary: { actKind: 'email.send', target: 'mailto:x@y.com' } },
      ),
    ).rejects.toBeInstanceOf(PolicyDeniedError);
  });

  it('does not record an act at suggest level', async () => {
    const store = new InMemoryBoundaryActStore();
    const registry = createSkillRegistry();
    const provider = createMockProvider({ responseText: JSON.stringify({ reply: 'idea' }) });
    const autonomy = new StaticAutonomyResolver('suggest');
    const runtime = new AgentRuntime({
      modelProvider: provider,
      skillRegistry: registry,
      boundaryGuard: new TomOnlyBoundaryGuard(store),
      autonomy,
      logger: silentLogger,
    });
    const ctrl = new AbortController();
    await runtime.invoke(
      defineAgent({
        key: 'tom',
        kind: 'boundary',
        requiresBoundary: true,
        description: 'Tom',
        inputs: z.object({}),
        outputs: z.object({ reply: z.string() }),
        promptRef: { id: 'inline:tom2', body: 'x', variables: [] },
        model: 'm',
        tools: [],
        autonomy: { default: 'suggest', max: 'auto_with_veto' },
        version: 1,
      }),
      {},
      { workspaceId: 'ws', userId: 'u1', abort: ctrl.signal },
      { boundary: { actKind: 'email.send', target: 'mailto:x@y.com' } },
    );
    expect(store.list()).toHaveLength(0);
  });
});
