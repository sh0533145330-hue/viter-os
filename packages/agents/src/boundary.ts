/**
 * Boundary discipline for outbound agent acts.
 *
 * The platform's invariant — codified in ADR-0004 — is that **Tom is
 * the only agent allowed to speak outside the workspace on behalf of
 * the user.** Every other agent (Tim, specialists, librarians) hands a
 * draft back to Tom and never crosses the boundary itself.
 *
 * The `BoundaryGuard` is a runtime enforcement point: callers must
 * invoke `assertCanSpeakOutside` before performing any outbound act,
 * and `recordAct` once the act has happened so the audit trail in
 * `tom_boundary_acts` reflects reality.
 */

import { PolicyDeniedError } from '@vita/core';
import type { BoundaryAct } from './types.js';

/** Persistence contract for boundary acts. Concrete impl lives in `@vita/db`. */
export interface BoundaryActStore {
  insert(act: BoundaryAct): Promise<void>;
}

/** In-memory store useful for tests and dev-mode workspaces. */
export class InMemoryBoundaryActStore implements BoundaryActStore {
  private readonly entries: BoundaryAct[] = [];

  async insert(act: BoundaryAct): Promise<void> {
    this.entries.push(act);
  }

  list(): readonly BoundaryAct[] {
    return this.entries;
  }
}

/**
 * Runtime gate enforcing the Tom-only-boundary discipline. Implementations
 * must throw {@link PolicyDeniedError} from `assertCanSpeakOutside` when
 * a non-Tom agent attempts an outbound act.
 */
export interface BoundaryGuard {
  /**
   * Throws {@link PolicyDeniedError} when `agentKey` is not authorised
   * to emit `actKind` toward `target`.
   */
  assertCanSpeakOutside(agentKey: string, actKind: string, target: string): void;

  /** Persist a successful boundary act for audit. */
  recordAct(act: BoundaryAct): Promise<void>;
}

/**
 * Default guard. Rejects every agent whose key is not `tom`.
 *
 * The optional `store` parameter receives every recorded act; pass an
 * `InMemoryBoundaryActStore` in tests and the durable store in
 * production wiring.
 */
export class TomOnlyBoundaryGuard implements BoundaryGuard {
  private readonly store: BoundaryActStore | undefined;

  constructor(store?: BoundaryActStore) {
    this.store = store;
  }

  assertCanSpeakOutside(agentKey: string, actKind: string, target: string): void {
    if (agentKey !== 'tom') {
      throw new PolicyDeniedError(
        `Agent '${agentKey}' may not cross the workspace boundary (act='${actKind}', target='${target}'). Only Tom is allowed; hand the draft back via Tom.`,
        { agentKey, actKind, target },
      );
    }
  }

  async recordAct(act: BoundaryAct): Promise<void> {
    if (act.agentKey !== 'tom') {
      throw new PolicyDeniedError(
        `Cannot record boundary act for non-Tom agent '${act.agentKey}'`,
        { agentKey: act.agentKey, actKind: act.actKind },
      );
    }
    if (this.store) await this.store.insert(act);
  }
}
