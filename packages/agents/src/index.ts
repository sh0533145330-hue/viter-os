/**
 * `@vita/agents` — agent SDK.
 *
 * Public OSS surface (MIT) used by Tom, Tim, the specialists, the
 * librarians, and any community-authored agent. The package exposes
 * authoring helpers (`defineAgent`, `defineSkill`), a prompt loader, a
 * boundary guard, an autonomy resolver, a model-provider abstraction,
 * an agent runtime, and the fine-tuning contracts.
 */

export { z } from 'zod';

export {
  defineAgent,
  type AgentDefinition,
  type AutonomyRange,
  type InferAgentInput,
  type InferAgentOutput,
  type PromptRef,
} from './agent.js';

export {
  createSkillRegistry,
  defineSkill,
  type SkillAutonomyLevel,
  type SkillContext,
  type SkillDefinition,
  type SkillRegistry,
} from './skill.js';

export {
  clearPromptCache,
  computePromptHash,
  loadPrompt,
  registerPrompt,
  renderPrompt,
  type PromptTemplate,
  type RenderedPrompt,
} from './prompt.js';

export {
  InMemoryBoundaryActStore,
  TomOnlyBoundaryGuard,
  type BoundaryActStore,
  type BoundaryGuard,
} from './boundary.js';

export {
  compareAutonomy,
  listAutonomyLevels,
  StaticAutonomyResolver,
  type AutonomyResolver,
} from './autonomy.js';

export {
  AgentRuntime,
  type AgentInvocationResult,
  type AgentRuntimeDeps,
  type BoundaryIntent,
  type CostRecorder,
  type InvokeOptions,
} from './runtime.js';

export {
  AnthropicProvider,
  createMockProvider,
  OpenAIProvider,
  TogetherProvider,
  type MockProviderOptions,
  type ModelMessage,
  type ModelProvider,
  type ModelRequest,
  type ModelResponse,
  type ModelTool,
} from './model-providers.js';

export {
  createAgentEvalRegistry,
  defineEvalSuite,
  runAgentEvalSuite,
  type AgentEvalRegistry,
  type EvalCase,
  type EvalResult,
  type EvalSuite,
} from './eval.js';

export {
  InMemoryTrainingPairCollector,
  StubAdapterRunner,
  type AdapterRunner,
  type AdapterTuneResult,
  type TrainingPair,
  type TrainingPairCollector,
  type TrainingPairSource,
} from './tuning.js';

export type {
  AgentKind,
  AutonomyLevel,
  BoundaryAct,
  InvocationContext,
  Logger,
  ToolDescriptor,
} from './types.js';

export const VERSION = '1.0.0-rc.0';
