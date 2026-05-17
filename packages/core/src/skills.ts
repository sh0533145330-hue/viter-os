/**
 * Skill registry.
 *
 * Skills are LLM-callable functions: reasoning, NL, fuzzy match. Per
 * `01-v1-master-spec.md` §15.1 / §15.5, each skill carries an autonomy
 * level so it can graduate from supervised → autonomous over time.
 *
 * This module is the in-process authoring + lookup surface; the durable
 * tables (`skill_definitions`, `skill_calls`, `skill_autonomy_state`) are
 * owned by `@vita/db` and the engine worker.
 */

import type { ZodTypeAny } from 'zod';
import { SkillRegistrationError } from './errors.js';

/** Autonomy ladder rungs. */
export type AutonomyLevel = 'supervised' | 'exceptions_only' | 'weekly_review' | 'autonomous';

/** Per-skill execution context. */
export interface SkillContext {
  readonly workspaceId: string;
  readonly userId?: string | undefined;
  readonly runId?: string | undefined;
  readonly abort: AbortSignal;
  readonly logger: {
    info(msg: string, data?: object): void;
    warn(msg: string, data?: object): void;
    error(msg: string, data?: object): void;
  };
}

/** Declarative skill description. */
export interface SkillDefinition<TParams = unknown, TReturns = unknown> {
  readonly key: string;
  readonly version?: number;
  readonly schema: ZodTypeAny;
  readonly returns: ZodTypeAny;
  readonly description: string;
  /** Optional owning agent key — `undefined` means platform-global. */
  readonly agentKey?: string;
  /** Initial autonomy level for newly-registered skills. */
  readonly initialAutonomy?: AutonomyLevel;
  readonly handler: (params: TParams, ctx: SkillContext) => Promise<TReturns>;
  readonly metadata?: Record<string, unknown>;
}

/** Lookup + registration surface. */
export interface SkillRegistry {
  register<TParams, TReturns>(skill: SkillDefinition<TParams, TReturns>): void;
  get(key: string): SkillDefinition | undefined;
  list(): readonly SkillDefinition[];
  listByAgent(agentKey: string): readonly SkillDefinition[];
  has(key: string): boolean;
  unregister(key: string): boolean;
}

const KEY_REGEX = /^[a-z0-9][a-z0-9_.-]{0,127}$/i;

class InMemorySkillRegistry implements SkillRegistry {
  private readonly map = new Map<string, SkillDefinition>();

  register<TParams, TReturns>(skill: SkillDefinition<TParams, TReturns>): void {
    if (!KEY_REGEX.test(skill.key)) {
      throw new SkillRegistrationError(`Skill key '${skill.key}' is invalid`);
    }
    if (this.map.has(skill.key)) {
      throw new SkillRegistrationError(`Skill '${skill.key}' is already registered`);
    }
    if (typeof skill.handler !== 'function') {
      throw new SkillRegistrationError(`Skill '${skill.key}' must declare a handler`);
    }
    this.map.set(skill.key, skill as unknown as SkillDefinition);
  }

  get(key: string): SkillDefinition | undefined {
    return this.map.get(key);
  }

  list(): readonly SkillDefinition[] {
    return Array.from(this.map.values());
  }

  listByAgent(agentKey: string): readonly SkillDefinition[] {
    return this.list().filter((s) => s.agentKey === agentKey);
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  unregister(key: string): boolean {
    return this.map.delete(key);
  }
}

/** Build a new in-memory skill registry. */
export function createSkillRegistry(): SkillRegistry {
  return new InMemorySkillRegistry();
}

/**
 * Helper to author a skill with full type inference. Returned shape is
 * the same as the input; the call exists for symmetry with
 * {@link defineBlock} and to validate the key.
 */
export function defineSkill<TParams, TReturns>(
  skill: SkillDefinition<TParams, TReturns>,
): SkillDefinition<TParams, TReturns> {
  if (!KEY_REGEX.test(skill.key)) {
    throw new SkillRegistrationError(`Skill key '${skill.key}' is invalid`);
  }
  return skill;
}
