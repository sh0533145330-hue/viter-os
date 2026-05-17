/**
 * Workflow authoring + lazy executor.
 *
 * A workflow is a typed graph of blocks connected by {@link Wire}s. This
 * module provides:
 *  - {@link defineWorkflow} for the authoring DSL,
 *  - {@link runWorkflow} for a synchronous-style topological executor.
 *
 * The runner here is the **lazy** in-process variant intended for unit
 * tests and embeddable use. The durable event-sourced variant lives in
 * `@vita/durable-jobs` and shares the same {@link WorkflowDefinition}.
 */

import type { ZodTypeAny, z } from 'zod';
import type { BlockDefinition } from './block.js';
import { WorkflowGraphError } from './errors.js';
import type { BlockId, EventBus, RunId, StepId } from './events.js';
import { runBlock } from './runtime.js';
import type { IdempotencyStore, RunBlockOptions } from './runtime.js';
import { type Wire, validateWires } from './wires.js';

/**
 * Reference to a block: either an inline definition (any TIn/TOut) or a
 * registry key the resolver knows how to look up.
 */
// biome-ignore lint/suspicious/noExplicitAny: covariance over generic block defs requires `any`.
export type BlockReference = BlockDefinition<any, any, object> | string;

/** Single node in a workflow graph. */
export interface WorkflowNode {
  readonly id: string;
  readonly block: BlockReference;
  readonly config?: Record<string, unknown>;
}

/** Workflow declarative shape. */
export interface WorkflowDefinition<TIn = unknown, TOut = unknown> {
  readonly key: string;
  readonly version: number;
  readonly inputs: ZodTypeAny;
  readonly outputs: ZodTypeAny;
  readonly blocks: readonly WorkflowNode[];
  readonly wires: readonly Wire[];
  /**
   * Optional output binding: maps top-level workflow output keys to a wire
   * source (block + port). If omitted, the runner returns whatever the
   * terminal block produced.
   */
  readonly outputBindings?: Readonly<Record<string, { blockId: string; port: string }>>;
  readonly description?: string;
  /** Phantom type carriers — never assign at runtime. */
  readonly __in?: TIn;
  readonly __out?: TOut;
}

const KEY_REGEX = /^[a-z0-9][a-z0-9_.-]{0,127}$/i;

/** Declare a workflow. Validates the graph at authoring time. */
export function defineWorkflow<TIn = unknown, TOut = unknown>(
  def: WorkflowDefinition<TIn, TOut>,
): WorkflowDefinition<TIn, TOut> {
  if (!KEY_REGEX.test(def.key)) {
    throw new WorkflowGraphError(`Workflow key '${def.key}' is invalid`);
  }
  if (def.version <= 0 || !Number.isInteger(def.version)) {
    throw new WorkflowGraphError('Workflow version must be a positive integer');
  }
  const ids = new Set<string>();
  for (const node of def.blocks) {
    if (ids.has(node.id)) {
      throw new WorkflowGraphError(`Duplicate block id '${node.id}' in workflow '${def.key}'`);
    }
    ids.add(node.id);
  }
  for (const wire of def.wires) {
    if (!ids.has(wire.from.blockId)) {
      throw new WorkflowGraphError(`Wire references missing source block '${wire.from.blockId}'`);
    }
    if (!ids.has(wire.to.blockId)) {
      throw new WorkflowGraphError(`Wire references missing target block '${wire.to.blockId}'`);
    }
  }
  return def;
}

/** Resolve a block reference to a concrete definition. */
export type BlockResolver = (ref: BlockReference) => BlockDefinition | undefined;

/** Dependencies injected into {@link runWorkflow}. */
export interface WorkflowDeps {
  resolveBlock: BlockResolver;
  idempotency?: IdempotencyStore;
  /** Custom context fields forwarded to every block handler. */
  extraContext?: object;
}

/** Per-run scaffolding the executor needs to issue block events. */
export interface RunWorkflowOptions {
  readonly runId: RunId;
  readonly workspaceId: string;
  readonly events: EventBus;
  readonly signal?: AbortSignal;
}

interface ResolvedNode {
  id: string;
  def: BlockDefinition;
  config: Record<string, unknown>;
}

function topoSort(nodes: readonly ResolvedNode[], wires: readonly Wire[]): ResolvedNode[] {
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  for (const n of nodes) {
    indegree.set(n.id, 0);
    adjacency.set(n.id, []);
  }
  for (const wire of wires) {
    if (wire.from.blockId === wire.to.blockId) continue;
    indegree.set(wire.to.blockId, (indegree.get(wire.to.blockId) ?? 0) + 1);
    adjacency.get(wire.from.blockId)?.push(wire.to.blockId);
  }
  const queue: string[] = [];
  for (const [id, deg] of indegree) if (deg === 0) queue.push(id);
  const sortedIds: string[] = [];
  while (queue.length) {
    const id = queue.shift();
    if (!id) break;
    sortedIds.push(id);
    for (const next of adjacency.get(id) ?? []) {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }
  if (sortedIds.length !== nodes.length) {
    throw new WorkflowGraphError('Workflow has a cycle');
  }
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  return sortedIds.map((id) => byId.get(id)).filter((n): n is ResolvedNode => Boolean(n));
}

/**
 * Build the input value for a single node by merging:
 *  - node config (lowest priority),
 *  - wired upstream outputs (port-by-port),
 *  - the special wildcard port `*` which assigns the entire upstream object.
 */
function buildNodeInput(
  node: ResolvedNode,
  wires: readonly Wire[],
  outputsByBlock: Map<string, unknown>,
  workflowInput: unknown,
): unknown {
  const incoming = wires.filter((w) => w.to.blockId === node.id);
  if (incoming.length === 0) {
    if (node.config && Object.keys(node.config).length > 0) {
      return { ...node.config };
    }
    return workflowInput;
  }
  const merged: Record<string, unknown> = { ...node.config };
  for (const wire of incoming) {
    const source =
      wire.from.blockId === '$workflow' ? workflowInput : outputsByBlock.get(wire.from.blockId);
    const value = extractPort(source, wire.from.port);
    if (wire.to.port === '*' || wire.to.port === '') {
      if (value && typeof value === 'object') Object.assign(merged, value);
    } else {
      merged[wire.to.port] = value;
    }
  }
  return merged;
}

function extractPort(source: unknown, port: string): unknown {
  if (port === 'default' || port === '' || port === '*') return source;
  if (source && typeof source === 'object' && port in (source as Record<string, unknown>)) {
    return (source as Record<string, unknown>)[port];
  }
  return undefined;
}

/**
 * Execute a workflow synchronously in-process. Returns the workflow's
 * declared output type. Throws on validation or block failure.
 */
export async function runWorkflow<TIn, TOut>(
  workflow: WorkflowDefinition<TIn, TOut>,
  rawInput: unknown,
  options: RunWorkflowOptions,
  deps: WorkflowDeps,
): Promise<TOut> {
  const inputParse = workflow.inputs.safeParse(rawInput);
  if (!inputParse.success) {
    throw new WorkflowGraphError(
      `Workflow '${workflow.key}' input validation failed: ${inputParse.error.message}`,
      { issues: inputParse.error.issues },
    );
  }
  const input = inputParse.data;

  const resolved: ResolvedNode[] = workflow.blocks.map((node) => {
    const def = deps.resolveBlock(node.block);
    if (!def) {
      throw new WorkflowGraphError(
        `Could not resolve block '${String(node.block)}' in workflow '${workflow.key}'`,
      );
    }
    return { id: node.id, def, config: node.config ?? {} };
  });

  validateWires(
    resolved.map((r) => ({ id: r.id, block: r.def })),
    workflow.wires,
  );

  const order = topoSort(resolved, workflow.wires);
  const outputs = new Map<string, unknown>();

  options.events.emit({
    type: 'run.started',
    runId: options.runId,
    workflowKey: workflow.key,
    workflowVersion: workflow.version,
    workspaceId: options.workspaceId,
    at: new Date().toISOString(),
  });

  try {
    for (const node of order) {
      const nodeInput = buildNodeInput(node, workflow.wires, outputs, input);
      const runOpts: RunBlockOptions = {
        runId: options.runId,
        stepId: node.id as StepId,
        blockId: node.id as BlockId,
        workspaceId: options.workspaceId,
        events: options.events,
        ...(options.signal ? { signal: options.signal } : {}),
        ...(deps.idempotency
          ? {
              idempotency: deps.idempotency,
              idempotencyKey: `${options.workspaceId}:${workflow.key}:${node.id}:${options.runId}`,
            }
          : {}),
        ...(deps.extraContext ? { extraContext: deps.extraContext } : {}),
      };
      const output = await runBlock(node.def, nodeInput, runOpts);
      outputs.set(node.id, output);
    }

    const result = buildWorkflowOutput(workflow, outputs, order);
    const outputParse = workflow.outputs.safeParse(result);
    if (!outputParse.success) {
      throw new WorkflowGraphError(
        `Workflow '${workflow.key}' produced invalid output: ${outputParse.error.message}`,
        { issues: outputParse.error.issues },
      );
    }

    options.events.emit({
      type: 'run.succeeded',
      runId: options.runId,
      output: outputParse.data,
      at: new Date().toISOString(),
    });
    return outputParse.data as TOut;
  } catch (err) {
    const code =
      err instanceof Error && 'code' in err ? String((err as { code: unknown }).code) : 'UNKNOWN';
    const message = err instanceof Error ? err.message : String(err);
    options.events.emit({
      type: 'run.failed',
      runId: options.runId,
      error: { code, message },
      at: new Date().toISOString(),
    });
    throw err;
  }
}

function buildWorkflowOutput(
  workflow: WorkflowDefinition,
  outputs: Map<string, unknown>,
  order: ResolvedNode[],
): unknown {
  if (workflow.outputBindings) {
    const result: Record<string, unknown> = {};
    for (const [key, binding] of Object.entries(workflow.outputBindings)) {
      const source = outputs.get(binding.blockId);
      result[key] = extractPort(source, binding.port);
    }
    return result;
  }
  const terminal = order[order.length - 1];
  if (!terminal) return undefined;
  return outputs.get(terminal.id);
}

/** Helper alias re-export. */
export type WorkflowInput<W> = W extends WorkflowDefinition<infer I, unknown> ? I : never;
export type WorkflowOutput<W> = W extends WorkflowDefinition<unknown, infer O> ? O : never;

/** Convenience: build inferred input shape from a Zod input schema. */
export type ZIn<S extends ZodTypeAny> = z.infer<S>;
