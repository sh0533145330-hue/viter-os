/**
 * Model provider contracts.
 *
 * Agents are model-agnostic at the SDK level. The runtime delegates
 * every completion to a `ModelProvider`; concrete implementations wrap
 * Anthropic, OpenAI, Together, or a workspace-local fine-tune.
 *
 * For tests and reference flows we expose `createMockProvider`, which
 * deterministically echoes the input and reports zero cost. The real
 * provider classes are declared here as stubs so the public surface is
 * stable; their `send` methods throw `NotImplementedError` until the
 * HTTP wiring lands.
 */

import { NotImplementedError } from '@vita/core';
import type { ZodTypeAny } from 'zod';

/** A single chat message in provider-neutral form. */
export interface ModelMessage {
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
}

/** Tool descriptor in provider-neutral form. */
export interface ModelTool {
  readonly name: string;
  readonly description: string;
  readonly schema: ZodTypeAny;
}

/** Inbound payload for `ModelProvider.send`. */
export interface ModelRequest {
  readonly model: string;
  readonly system: string;
  readonly messages: readonly ModelMessage[];
  readonly tools?: readonly ModelTool[];
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly toolChoice?: 'auto' | 'none' | { name: string };
  readonly metadata?: Record<string, unknown>;
}

/** Outbound payload returned by `ModelProvider.send`. */
export interface ModelResponse {
  readonly text?: string;
  readonly toolCalls?: readonly { name: string; arguments: unknown }[];
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly costCents: number;
  readonly model: string;
  readonly finishReason?: 'stop' | 'length' | 'tool_use' | 'error';
}

/** Provider-agnostic completion endpoint. */
export interface ModelProvider {
  readonly name: string;
  send(req: ModelRequest): Promise<ModelResponse>;
}

/** Options accepted by {@link createMockProvider}. */
export interface MockProviderOptions {
  /** When set, every response will use this text. */
  readonly responseText?: string;
  /** When set, every response will report these tool calls. */
  readonly toolCalls?: readonly { name: string; arguments: unknown }[];
  /** Override cost-per-call in fractional cents. Default `0`. */
  readonly costCents?: number;
  /** Override model name reported back in the response. */
  readonly modelName?: string;
}

/**
 * Deterministic in-memory provider used by tests. Returns the
 * configured text/tool calls and never makes a network call.
 */
export function createMockProvider(opts: MockProviderOptions = {}): ModelProvider {
  const costCents = opts.costCents ?? 0;
  return {
    name: 'mock',
    async send(req: ModelRequest): Promise<ModelResponse> {
      const text = opts.responseText ?? req.messages[req.messages.length - 1]?.content ?? '';
      const base = {
        tokensIn: req.messages.reduce((sum, m) => sum + m.content.length, 0),
        tokensOut: text.length,
        costCents,
        model: opts.modelName ?? req.model,
      } as const;
      if (opts.toolCalls && opts.toolCalls.length > 0) {
        return {
          ...base,
          toolCalls: opts.toolCalls,
          finishReason: 'tool_use',
        };
      }
      return { ...base, text, finishReason: 'stop' };
    },
  };
}

abstract class BaseHttpProvider implements ModelProvider {
  abstract readonly name: string;
  abstract send(req: ModelRequest): Promise<ModelResponse>;
}

/** Stub provider for the Anthropic Messages API. Wire up in worker. */
export class AnthropicProvider extends BaseHttpProvider {
  override readonly name = 'anthropic';
  override async send(_req: ModelRequest): Promise<ModelResponse> {
    throw new NotImplementedError('AnthropicProvider.send');
  }
}

/** Stub provider for the OpenAI Responses API. */
export class OpenAIProvider extends BaseHttpProvider {
  override readonly name = 'openai';
  override async send(_req: ModelRequest): Promise<ModelResponse> {
    throw new NotImplementedError('OpenAIProvider.send');
  }
}

/** Stub provider for the Together.ai inference API. */
export class TogetherProvider extends BaseHttpProvider {
  override readonly name = 'together';
  override async send(_req: ModelRequest): Promise<ModelResponse> {
    throw new NotImplementedError('TogetherProvider.send');
  }
}
