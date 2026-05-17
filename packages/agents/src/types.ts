/**
 * Shared types for the `@vita/agents` SDK.
 *
 * Public OSS surface — every shape consumed by agent authors, the
 * runtime, and downstream tooling lives here. Keep this module free of
 * runtime imports so it can be picked up by lightweight consumers.
 */

import type { ZodTypeAny } from 'zod';

/**
 * Agent role taxonomy.
 *
 * - `boundary` — the agent may speak outside the workspace on behalf of
 *   the user (only Tom is allowed; see ADR-0004).
 * - `team` — orchestrates work across people inside a workspace
 *   (e.g. Tim). Never crosses the boundary itself.
 * - `specialist` — domain-focused agent (Deny for design, Cal for
 *   numbers, etc.).
 * - `librarian` — background steward of the data plane (entity linker,
 *   anonymizer, …).
 */
export type AgentKind = 'boundary' | 'team' | 'specialist' | 'librarian';

/**
 * Autonomy ladder for boundary / external acts.
 *
 * 1. `suggest` — surface an idea, never act.
 * 2. `draft_confirm` — prepare a draft and wait for explicit approval.
 * 3. `auto_with_limits` — act automatically when within configured
 *    thresholds (budgets, recipient allow-lists, etc.).
 * 4. `auto_with_veto` — act, but the user retains an undo / veto window.
 */
export type AutonomyLevel = 'suggest' | 'draft_confirm' | 'auto_with_limits' | 'auto_with_veto';

/** Structured logger contract used by the runtime. */
export interface Logger {
  info(msg: string, data?: object): void;
  warn(msg: string, data?: object): void;
  error(msg: string, data?: object): void;
  debug?(msg: string, data?: object): void;
}

/** Per-call execution context handed to {@link AgentRuntime.invoke}. */
export interface InvocationContext {
  readonly workspaceId: string;
  readonly userId?: string | undefined;
  readonly runId?: string | undefined;
  readonly abort: AbortSignal;
  readonly metadata?: Record<string, unknown> | undefined;
}

/** A single recorded outbound act crossing the workspace boundary. */
export interface BoundaryAct {
  readonly workspaceId: string;
  readonly userId?: string | undefined;
  readonly agentKey: string;
  readonly actKind: string;
  readonly target: string;
  readonly autonomy: AutonomyLevel;
  readonly at: Date;
  readonly payload?: Record<string, unknown> | undefined;
  readonly promptHash?: string | undefined;
  readonly runId?: string | undefined;
}

/** Provider-agnostic tool descriptor passed to a {@link ModelProvider}. */
export interface ToolDescriptor {
  readonly name: string;
  readonly description: string;
  readonly schema: ZodTypeAny;
}
