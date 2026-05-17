/**
 * `@vita/core` — VitaOS engine SDK.
 *
 * Public OSS surface. Block authors, workflow designers, and the engine
 * runtime all import from this entry point. The submodule under
 * `@vita/core/types` re-exports just the types if a consumer wants to
 * avoid pulling runtime code.
 */

export { z } from 'zod';

export { defineBlock } from './block.js';
export type {
  BlockCategory,
  BlockContext,
  BlockDefinition,
  BlockHandler,
  BlockLogger,
  InferBlockInput,
  InferBlockOutput,
  RetryPolicy,
} from './block.js';

export {
  compareSchemas,
  validateWires,
} from './wires.js';
export type { PortRef, SchemaCompatibility, Wire } from './wires.js';

export { createEventBus } from './events.js';
export type {
  AnyEventHandler,
  BlockFailedEvent,
  BlockId,
  BlockRetriedEvent,
  BlockStartedEvent,
  BlockSucceededEvent,
  EventBus,
  EventHandler,
  RunCancelledEvent,
  RunFailedEvent,
  RunId,
  RunStartedEvent,
  RunSucceededEvent,
  StepId,
  VitaEvent,
  VitaEventOfType,
  VitaEventType,
} from './events.js';

export {
  compileJSONata,
  evaluateJSONata,
  getJSONataCacheStats,
  resetJSONataCache,
} from './jsonata.js';
export type { EvaluateOptions, JSONataCacheStats, JSONataResult } from './jsonata.js';

export {
  MemoryIdempotencyStore,
  NullIdempotencyStore,
  runBlock,
} from './runtime.js';
export type { IdempotencyStore, RunBlockOptions } from './runtime.js';

export { defineWorkflow, runWorkflow } from './workflow.js';
export type {
  BlockReference,
  BlockResolver,
  RunWorkflowOptions,
  WorkflowDefinition,
  WorkflowDeps,
  WorkflowInput,
  WorkflowNode,
  WorkflowOutput,
} from './workflow.js';

export { defaultPolicy, modelCatalog } from './engine.js';
export type { EnginePolicy, ModelChoice, ModelChoiceInput, ModelProvider } from './engine.js';

export { BudgetGuard } from './budgets.js';
export type { BudgetDecision, BudgetState } from './budgets.js';

export { createSkillRegistry, defineSkill } from './skills.js';
export type {
  AutonomyLevel,
  SkillContext,
  SkillDefinition,
  SkillRegistry,
} from './skills.js';

export {
  BlockCancelledError,
  BlockNonRetryableError,
  BlockRetryableError,
  BlockTimeoutError,
  BlockValidationError,
  BudgetExceededError,
  NotImplementedError,
  PolicyDeniedError,
  SkillRegistrationError,
  VitaError,
  WireTypeError,
  WorkflowGraphError,
} from './errors.js';

export const VERSION = '1.0.0-rc.0';
