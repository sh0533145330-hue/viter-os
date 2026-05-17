/**
 * Autonomy resolution for agent acts.
 *
 * Autonomy is per-user × per-agent × per-act-kind so the user retains
 * fine-grained control over what each agent may do on their behalf.
 * The default resolver pins everything to `draft_confirm` so nothing
 * surprising ever escapes the workspace until the user opts in.
 */

import type { AutonomyLevel } from './types.js';

const ORDER: readonly AutonomyLevel[] = [
  'suggest',
  'draft_confirm',
  'auto_with_limits',
  'auto_with_veto',
] as const;

/**
 * Compare two autonomy levels.
 *
 * @returns negative when `a` is less autonomous than `b`, zero on
 *   equality, positive when `a` is more autonomous than `b`.
 */
export function compareAutonomy(a: AutonomyLevel, b: AutonomyLevel): number {
  return ORDER.indexOf(a) - ORDER.indexOf(b);
}

/** Strongly-typed list of every autonomy rung, ordered low → high. */
export function listAutonomyLevels(): readonly AutonomyLevel[] {
  return ORDER;
}

/**
 * Resolver consulted before any agent act crosses the boundary. The
 * answer determines whether the runtime acts, drafts, or merely
 * suggests.
 */
export interface AutonomyResolver {
  resolveForUser(
    workspaceId: string,
    userId: string,
    agentKey: string,
    actKind: string,
  ): Promise<AutonomyLevel>;
}

/**
 * Resolver backed by an in-memory map.
 *
 * Keyed by `${workspaceId}:${userId}:${agentKey}:${actKind}` with
 * progressively broader fallbacks. Useful for tests and bootstrapping
 * before the durable per-workspace store is available.
 */
export class StaticAutonomyResolver implements AutonomyResolver {
  private readonly entries = new Map<string, AutonomyLevel>();
  private readonly fallback: AutonomyLevel;

  constructor(fallback: AutonomyLevel = 'draft_confirm') {
    this.fallback = fallback;
  }

  set(
    workspaceId: string,
    userId: string,
    agentKey: string,
    actKind: string,
    level: AutonomyLevel,
  ): void {
    this.entries.set(this.key(workspaceId, userId, agentKey, actKind), level);
  }

  async resolveForUser(
    workspaceId: string,
    userId: string,
    agentKey: string,
    actKind: string,
  ): Promise<AutonomyLevel> {
    const exact = this.entries.get(this.key(workspaceId, userId, agentKey, actKind));
    if (exact) return exact;
    const agentDefault = this.entries.get(`${workspaceId}:${userId}:${agentKey}:*`);
    if (agentDefault) return agentDefault;
    const userDefault = this.entries.get(`${workspaceId}:${userId}:*:*`);
    if (userDefault) return userDefault;
    return this.fallback;
  }

  private key(workspaceId: string, userId: string, agentKey: string, actKind: string): string {
    return `${workspaceId}:${userId}:${agentKey}:${actKind}`;
  }
}
