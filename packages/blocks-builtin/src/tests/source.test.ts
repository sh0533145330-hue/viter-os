import {
  type BlockId,
  NotImplementedError,
  type RunId,
  type StepId,
  createEventBus,
  runBlock,
} from '@vita/core';
import { describe, expect, it } from 'vitest';
import { invokeActionBlock } from '../action/index.js';
import { callAgentBlock } from '../agent/index.js';
import { createEntityBlock } from '../entity/index.js';
import { l0FetchBlock, searchQueryBlock } from '../source/index.js';

const baseOptions = {
  runId: 'run' as RunId,
  stepId: 'step' as StepId,
  blockId: 'block' as BlockId,
  workspaceId: 'ws',
};

describe('stub blocks throw NotImplementedError when ctx dependencies missing', () => {
  it('source.l0_fetch', async () => {
    const events = createEventBus();
    await expect(
      runBlock(l0FetchBlock, { sourceKey: 's', limit: 10 }, { ...baseOptions, events }),
    ).rejects.toBeInstanceOf(NotImplementedError);
  });

  it('source.search_query', async () => {
    const events = createEventBus();
    await expect(
      runBlock(searchQueryBlock, { query: 'hi', limit: 5 }, { ...baseOptions, events }),
    ).rejects.toBeInstanceOf(NotImplementedError);
  });

  it('entity.create', async () => {
    const events = createEventBus();
    await expect(
      runBlock(
        createEntityBlock,
        { entityType: 'Deal', data: { name: 'X' } },
        { ...baseOptions, events },
      ),
    ).rejects.toBeInstanceOf(NotImplementedError);
  });

  it('action.invoke', async () => {
    const events = createEventBus();
    await expect(
      runBlock(
        invokeActionBlock,
        { actionKey: 'a', payload: {}, dryRun: false },
        { ...baseOptions, events },
      ),
    ).rejects.toBeInstanceOf(NotImplementedError);
  });

  it('agent.call', async () => {
    const events = createEventBus();
    await expect(
      runBlock(callAgentBlock, { agentKey: 'tom', input: {} }, { ...baseOptions, events }),
    ).rejects.toBeInstanceOf(NotImplementedError);
  });
});

describe('stub blocks call into injected runtimes', () => {
  it('source.l0_fetch dispatches to ctx.sources', async () => {
    const events = createEventBus();
    const out = await runBlock(
      l0FetchBlock,
      { sourceKey: 'leads', limit: 1 },
      {
        ...baseOptions,
        events,
        extraContext: {
          sources: {
            fetchL0: async () => ({
              rows: [{ id: 'row-1' }],
              fetchedAt: '2026-05-13T00:00:00Z',
            }),
          },
        },
      },
    );
    expect(out.rows).toEqual([{ id: 'row-1' }]);
  });
});

describe('todo placeholders for fully-wired blocks', () => {
  // Concrete behaviour ships alongside @vita/db, @vita/agents, and @vita/policy
  // wiring; see EP-07 follow-up tickets T-EP07-009..013.
  it.todo('entity.create writes a row via @vita/db');
  it.todo('entity.update enforces optimistic concurrency');
  it.todo('entity.batch rolls back atomically when atomic=true');
  it.todo('action.invoke records to actions ledger');
  it.todo('action.propose enqueues into approvals queue');
  it.todo('action.await_approval blocks until decision is recorded');
  it.todo('agent.call charges token usage to the workspace budget');
  it.todo('agent.route_to_specialist uses domain affinity heuristics');
  it.todo('agent.run_in_tom_context attaches the Theory-of-Mind kernel');
  it.todo('source.embedding_query returns vector hits with payload');
  it.todo('source.search_query honours fielded filters');
  it.todo('source.l1_fetch, l2_fetch, l3_fetch use the storage layer');
  it.todo('gate.approval persists the proposal and waits for review');
  it.todo('gate.policy delegates to @vita/policy authorize');
  it.todo('utility.sub_workflow resolves the workflow registry');
});
