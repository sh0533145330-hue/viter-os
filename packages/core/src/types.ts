/**
 * Public type re-exports for `@vita/core`.
 *
 * Importers can pull narrow types from `@vita/core/types` rather than
 * the entire module surface, which keeps editor bundles small.
 */

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

export type {
  IdempotencyStore,
  RunBlockOptions,
} from './runtime.js';

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

export type { EnginePolicy, ModelChoice, ModelChoiceInput, ModelProvider } from './engine.js';

export type { BudgetDecision, BudgetState } from './budgets.js';

export type {
  AutonomyLevel,
  SkillContext,
  SkillDefinition,
  SkillRegistry,
} from './skills.js';

export type { PortRef, SchemaCompatibility, Wire } from './wires.js';

export type { EvaluateOptions, JSONataCacheStats, JSONataResult } from './jsonata.js';
