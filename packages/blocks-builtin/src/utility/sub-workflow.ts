import {
  type EventBus,
  NotImplementedError,
  type RunId,
  type WorkflowDefinition,
  defineBlock,
  runWorkflow,
} from '@vita/core';
import { z } from 'zod';

const inputs = z.object({
  workflowKey: z.string().min(1),
  version: z.number().int().positive().optional(),
  input: z.unknown(),
});

const outputs = z.object({
  subRunId: z.string(),
  output: z.unknown(),
});

type Inputs = z.infer<typeof inputs>;
type Outputs = z.infer<typeof outputs>;

export interface SubWorkflowContext {
  resolveWorkflow?: (key: string, version?: number) => WorkflowDefinition | undefined;
  resolveBlock?: import('@vita/core').BlockResolver;
  buildChildEvents?: (parentEvents: EventBus, subRunId: RunId) => EventBus;
  nextRunId?: () => RunId;
}

/**
 * Invoke another workflow as a child run. Looks the workflow up via
 * `ctx.resolveWorkflow` (typically backed by a registry) and runs it
 * with the same in-process executor as the parent.
 */
export const subWorkflowBlock = defineBlock<Inputs, Outputs, SubWorkflowContext>({
  key: 'utility.sub_workflow',
  category: 'utility',
  description: 'Run another workflow as a child invocation.',
  inputs,
  outputs,
  idempotent: false,
  handler: async (input, ctx) => {
    const { resolveWorkflow, resolveBlock } = ctx;
    if (!resolveWorkflow || !resolveBlock) {
      throw new NotImplementedError('utility.sub_workflow requires resolveWorkflow + resolveBlock');
    }
    const wf = resolveWorkflow(input.workflowKey, input.version);
    if (!wf) throw new Error(`Workflow '${input.workflowKey}' not found`);
    const subRunId = ctx.nextRunId?.() ?? (`${ctx.runId}.${input.workflowKey}` as RunId);
    const events = ctx.buildChildEvents?.(ctx.events, subRunId) ?? ctx.events;
    const output = await runWorkflow(
      wf,
      input.input,
      {
        runId: subRunId,
        workspaceId: ctx.workspaceId,
        events,
        signal: ctx.abort,
      },
      { resolveBlock },
    );
    return { subRunId: String(subRunId), output };
  },
});
