/**
 * Per-workspace fine-tuning contracts (see ADR-0010).
 *
 * The collector accumulates `TrainingPair`s — `(prompt, chosen, rejected)`
 * triples sourced from user edits, undos, rejects, and ratings — into a
 * per-workspace store. The runner then bakes a workspace-scoped adapter
 * for the agent and reports eval lift before/after.
 *
 * This module declares the public types and stubs only; the durable
 * collector lives in `@vita/db` and the runner lives in
 * `apps/worker-tuner`.
 */

import { NotImplementedError } from '@vita/core';

/** Source of a training signal — used to weight the loss function. */
export type TrainingPairSource = 'edit' | 'undo' | 'reject' | 'rating';

/** One `(prompt, chosen, rejected)` triple used for DPO/RLAIF tuning. */
export interface TrainingPair {
  readonly workspaceId: string;
  readonly agentKey: string;
  readonly prompt: unknown;
  readonly chosen: unknown;
  readonly rejected: unknown;
  readonly source: TrainingPairSource;
  /** Optional ratings/weights metadata. */
  readonly metadata?: Record<string, unknown> | undefined;
}

/** Accumulator + reader interface. */
export interface TrainingPairCollector {
  record(pair: TrainingPair): Promise<void>;
  collectForWeek(workspaceId: string, agentKey: string): Promise<readonly TrainingPair[]>;
}

/** Tuning job result. */
export interface AdapterTuneResult {
  readonly adapterUri: string;
  readonly evalBefore: number;
  readonly evalAfter: number;
  readonly pairs: number;
}

/** Adapter runner contract. */
export interface AdapterRunner {
  tune(
    workspaceId: string,
    agentKey: string,
    pairs: readonly TrainingPair[],
  ): Promise<AdapterTuneResult>;
}

/**
 * Reference in-memory collector useful for tests. The real
 * implementation persists to `agent_training_pairs` in `@vita/db`.
 */
export class InMemoryTrainingPairCollector implements TrainingPairCollector {
  private readonly pairs: TrainingPair[] = [];

  async record(pair: TrainingPair): Promise<void> {
    this.pairs.push(pair);
  }

  async collectForWeek(workspaceId: string, agentKey: string): Promise<readonly TrainingPair[]> {
    return this.pairs.filter((p) => p.workspaceId === workspaceId && p.agentKey === agentKey);
  }
}

/** Stub runner — concrete implementation lives in the tuner worker. */
export class StubAdapterRunner implements AdapterRunner {
  async tune(
    _workspaceId: string,
    _agentKey: string,
    _pairs: readonly TrainingPair[],
  ): Promise<AdapterTuneResult> {
    throw new NotImplementedError('StubAdapterRunner.tune');
  }
}
