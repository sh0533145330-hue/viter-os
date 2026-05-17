/**
 * Agent runtime skeleton.
 *
 * The runtime composes the moving parts the SDK provides — schemas,
 * prompt templates, the boundary guard, the autonomy resolver, the
 * model provider, and the skill registry — into a single `invoke` call
 * that agent authors can ignore.
 *
 * The implementation here is intentionally minimal: it validates
 * input, renders the prompt, performs boundary preflight when
 * `requiresBoundary` is set, dispatches a single completion via the
 * injected `ModelProvider`, and records the cost. Multi-step tool use,
 * retries, and durable run logging are layered on top by the host
 * (worker process or app server).
 */

import type { SkillRegistry } from '@vita/core';
import { BlockValidationError, PolicyDeniedError } from '@vita/core';

import type { AgentDefinition } from './agent.js';
import type { AutonomyResolver } from './autonomy.js';
import type { BoundaryGuard } from './boundary.js';
import type {
  ModelMessage,
  ModelProvider,
  ModelRequest,
  ModelResponse,
  ModelTool,
} from './model-providers.js';
import { loadPrompt, renderPrompt } from './prompt.js';
import type { AutonomyLevel, BoundaryAct, InvocationContext, Logger } from './types.js';

/** Optional cost sink. The default in-process runner reports to logs. */
export interface CostRecorder {
  record(
    workspaceId: string,
    agentKey: string,
    costCents: number,
    tokensIn: number,
    tokensOut: number,
  ): void;
}

/** Dependencies the runtime is constructed with. */
export interface AgentRuntimeDeps {
  readonly modelProvider: ModelProvider;
  readonly skillRegistry: SkillRegistry;
  readonly boundaryGuard: BoundaryGuard;
  readonly autonomy: AutonomyResolver;
  readonly logger: Logger;
  readonly costRecorder?: CostRecorder | undefined;
}

/**
 * Optional descriptor of a boundary act that the agent intends to
 * perform during this invocation. The runtime preflights it against
 * the `BoundaryGuard` and the user's autonomy preferences before
 * calling the model.
 */
export interface BoundaryIntent {
  readonly actKind: string;
  readonly target: string;
  readonly payload?: Record<string, unknown> | undefined;
}

/** Per-call options extending {@link InvocationContext}. */
export interface InvokeOptions {
  /** Variables for prompt rendering. */
  readonly promptVars?: Record<string, unknown>;
  /** Boundary act being attempted, when applicable. */
  readonly boundary?: BoundaryIntent | undefined;
  /** Optional override for the model identifier. */
  readonly modelOverride?: string | undefined;
}

/** Full result of {@link AgentRuntime.invoke}. */
export interface AgentInvocationResult<TOutput> {
  readonly output: TOutput;
  readonly autonomyLevel: AutonomyLevel | undefined;
  readonly model: ModelResponse;
  readonly promptHash: string;
  readonly toolCalls: readonly { name: string; arguments: unknown }[];
}

/** Shape used internally to thread skill descriptors to the provider. */
function resolveTools(
  agentKey: string,
  toolKeys: readonly string[],
  registry: SkillRegistry,
): readonly ModelTool[] {
  const out: ModelTool[] = [];
  for (const key of toolKeys) {
    const skill = registry.get(key);
    if (!skill) {
      throw new BlockValidationError(`Agent '${agentKey}' references unknown skill '${key}'`, {
        agentKey,
        skillKey: key,
      });
    }
    out.push({
      name: skill.key,
      description: skill.description,
      schema: skill.schema,
    });
  }
  return out;
}

/**
 * Runtime composition entry point. One instance is typically created
 * per process and reused for every agent invocation.
 */
export class AgentRuntime {
  private readonly deps: AgentRuntimeDeps;

  constructor(deps: AgentRuntimeDeps) {
    this.deps = deps;
  }

  /**
   * Execute an agent end-to-end:
   *
   * 1. Validate input against `agent.inputs`.
   * 2. Render the system prompt (caching the template).
   * 3. Boundary preflight when the agent claims `requiresBoundary`.
   * 4. Resolve the user's autonomy level for any declared boundary act.
   * 5. Dispatch one model completion via {@link ModelProvider}.
   * 6. Record cost via the optional {@link CostRecorder}.
   * 7. Validate the model output (text body) against `agent.outputs`.
   * 8. Persist the boundary act when the model finished a `stop` /
   *    text response and an act was declared.
   */
  async invoke<TInput, TOutput>(
    agent: AgentDefinition<TInput, TOutput>,
    input: TInput,
    ctx: InvocationContext,
    opts: InvokeOptions = {},
  ): Promise<AgentInvocationResult<TOutput>> {
    const inputCheck = agent.inputs.safeParse(input);
    if (!inputCheck.success) {
      throw new BlockValidationError(`Agent '${agent.key}' input failed validation`, {
        agentKey: agent.key,
        issues: inputCheck.error.issues,
      });
    }

    const template = loadPrompt(agent.promptRef);
    const rendered = renderPrompt(template, opts.promptVars ?? {});

    let autonomyLevel: AutonomyLevel | undefined;
    if (opts.boundary) {
      if (!agent.requiresBoundary) {
        throw new PolicyDeniedError(
          `Agent '${agent.key}' declared a boundary act but is not a boundary agent`,
          { agentKey: agent.key, actKind: opts.boundary.actKind },
        );
      }
      this.deps.boundaryGuard.assertCanSpeakOutside(
        agent.key,
        opts.boundary.actKind,
        opts.boundary.target,
      );
      if (ctx.userId) {
        autonomyLevel = await this.deps.autonomy.resolveForUser(
          ctx.workspaceId,
          ctx.userId,
          agent.key,
          opts.boundary.actKind,
        );
      } else {
        autonomyLevel = agent.autonomy.default;
      }
    }

    const tools = resolveTools(agent.key, agent.tools, this.deps.skillRegistry);
    const userMessage: ModelMessage = {
      role: 'user',
      content: JSON.stringify(inputCheck.data),
    };
    const request: ModelRequest = {
      model: opts.modelOverride ?? agent.model,
      system: rendered.text,
      messages: [userMessage],
      tools,
      metadata: { agentKey: agent.key, workspaceId: ctx.workspaceId, runId: ctx.runId },
    };

    const response = await this.deps.modelProvider.send(request);
    this.deps.costRecorder?.record(
      ctx.workspaceId,
      agent.key,
      response.costCents,
      response.tokensIn,
      response.tokensOut,
    );
    this.deps.logger.info('agent invoked', {
      agentKey: agent.key,
      workspaceId: ctx.workspaceId,
      runId: ctx.runId,
      model: response.model,
      tokensIn: response.tokensIn,
      tokensOut: response.tokensOut,
      costCents: response.costCents,
      promptHash: rendered.hash,
    });

    const toolCalls = response.toolCalls ?? [];
    const outputRaw = response.text !== undefined ? safeJson(response.text) : { toolCalls };
    const outputCheck = agent.outputs.safeParse(outputRaw);
    if (!outputCheck.success) {
      throw new BlockValidationError(`Agent '${agent.key}' output failed validation`, {
        agentKey: agent.key,
        issues: outputCheck.error.issues,
      });
    }

    if (opts.boundary && autonomyLevel && autonomyLevel !== 'suggest') {
      const act: BoundaryAct = {
        workspaceId: ctx.workspaceId,
        agentKey: agent.key,
        actKind: opts.boundary.actKind,
        target: opts.boundary.target,
        autonomy: autonomyLevel,
        at: new Date(),
        ...(ctx.userId !== undefined ? { userId: ctx.userId } : {}),
        ...(opts.boundary.payload !== undefined ? { payload: opts.boundary.payload } : {}),
        ...(ctx.runId !== undefined ? { runId: ctx.runId } : {}),
        promptHash: rendered.hash,
      };
      await this.deps.boundaryGuard.recordAct(act);
    }

    return {
      output: outputCheck.data as TOutput,
      autonomyLevel,
      model: response,
      promptHash: rendered.hash,
      toolCalls,
    };
  }
}

function safeJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return {};
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return { text };
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return { text };
  }
}
