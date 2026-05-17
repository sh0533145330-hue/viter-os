/**
 * Skill authoring helpers.
 *
 * Skills are LLM-callable functions registered with the engine's
 * `SkillRegistry` (see `@vita/core`). Agents declare the set of skills
 * they may invoke via `AgentDefinition.tools`; the runtime resolves
 * those keys against the registry at invocation time.
 *
 * This module re-exports the canonical helpers from `@vita/core` so
 * agent authors only need to depend on `@vita/agents`.
 */

export { createSkillRegistry, defineSkill } from '@vita/core';
export type {
  AutonomyLevel as SkillAutonomyLevel,
  SkillContext,
  SkillDefinition,
  SkillRegistry,
} from '@vita/core';
