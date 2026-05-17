/**
 * `@vita/blocks-builtin` — the canonical block palette shipped with VitaOS.
 *
 * Public OSS MIT package. Every block declares its inputs/outputs via Zod
 * so workflows can be composed against stable contracts. Blocks that need
 * persistence, agent runtimes, or external services pull those
 * dependencies from the runtime context (e.g. `ctx.db`, `ctx.agents`) so
 * this package stays decoupled from `@vita/db` and `@vita/agents`.
 */

import type { BlockDefinition } from '@vita/core';

export * from './utility/index.js';
export * from './gate/index.js';
export * from './entity/index.js';
export * from './action/index.js';
export * from './agent/index.js';
export * from './source/index.js';

import { awaitApprovalBlock, invokeActionBlock, proposeActionBlock } from './action/index.js';
import { callAgentBlock, routeToSpecialistBlock, runInTomContextBlock } from './agent/index.js';
import {
  batchEntityBlock,
  createEntityBlock,
  deleteEntityBlock,
  findOrCreateEntityBlock,
  linkEntityBlock,
  queryEntityBlock,
  updateEntityBlock,
} from './entity/index.js';
import {
  approvalGateBlock,
  autonomyGateBlock,
  conditionalBlock,
  policyGateBlock,
  timeWindowGateBlock,
} from './gate/index.js';
import {
  embeddingQueryBlock,
  l0FetchBlock,
  l1FetchBlock,
  l2FetchBlock,
  l3FetchBlock,
  searchQueryBlock,
} from './source/index.js';
import {
  foreachBlock,
  formatBlock,
  logBlock,
  parallelBlock,
  sleepBlock,
  subWorkflowBlock,
  transformBlock,
} from './utility/index.js';

// biome-ignore lint/suspicious/noExplicitAny: registry holds heterogeneous blocks.
type AnyBlock = BlockDefinition<any, any, object>;

const ALL_BUILTIN_BLOCKS: readonly AnyBlock[] = [
  transformBlock, formatBlock, logBlock, sleepBlock, parallelBlock, foreachBlock, subWorkflowBlock,
  conditionalBlock, approvalGateBlock, autonomyGateBlock, timeWindowGateBlock, policyGateBlock,
  createEntityBlock, updateEntityBlock, deleteEntityBlock, linkEntityBlock, queryEntityBlock, findOrCreateEntityBlock, batchEntityBlock,
  invokeActionBlock, proposeActionBlock, awaitApprovalBlock,
  callAgentBlock, routeToSpecialistBlock, runInTomContextBlock,
  l0FetchBlock, l1FetchBlock, l2FetchBlock, l3FetchBlock, searchQueryBlock, embeddingQueryBlock,
];

/** Every built-in block keyed by its canonical key string. */
export const builtinBlocks: Readonly<Record<string, AnyBlock>> = Object.freeze(
  Object.fromEntries(ALL_BUILTIN_BLOCKS.map((b) => [b.key, b])),
);

/** Resolver helper that workflows can pass to `runWorkflow`. */
export function resolveBuiltinBlock(keyOrDef: AnyBlock | string): AnyBlock | undefined {
  if (typeof keyOrDef === 'string') return builtinBlocks[keyOrDef];
  return keyOrDef;
}

export const VERSION = '1.0.0-rc.0';
