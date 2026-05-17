/**
 * Engine-level model selection.
 *
 * The engine picks an LLM provider + model per agent call. This module
 * exposes the policy interface and a sensible default rule-based policy.
 * Production deployments can plug in an A/B router or cost-aware picker.
 */

/** Supported LLM providers. */
export type ModelProvider = 'anthropic' | 'openai' | 'together';

/** Concrete model selection. */
export interface ModelChoice {
  readonly provider: ModelProvider;
  readonly model: string;
  readonly costPerInputToken?: number;
  readonly costPerOutputToken?: number;
}

/** Inputs to the picker. */
export interface ModelChoiceInput {
  readonly agentKey: string;
  /** Workspace's remaining budget in cents. When < ~50, the picker prefers cheaper models. */
  readonly budgetRemainingCents?: number;
  /** A/B experiment pair identifier. */
  readonly abPair?: string;
  /** Optional override hint from a caller. */
  readonly hint?: 'cheap' | 'best' | 'oss';
}

/** Engine policy contract. */
export interface EnginePolicy {
  choose(input: ModelChoiceInput): ModelChoice;
}

/** Default model catalogue used by {@link defaultPolicy}. */
const CATALOG: Readonly<Record<string, ModelChoice>> = {
  'claude-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
  },
  'claude-haiku': {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    costPerInputToken: 0.0000008,
    costPerOutputToken: 0.000004,
  },
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o-2024-11-20',
    costPerInputToken: 0.0000025,
    costPerOutputToken: 0.00001,
  },
  'together-llama': {
    provider: 'together',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    costPerInputToken: 0.00000088,
    costPerOutputToken: 0.00000088,
  },
};

/**
 * Default rule-based policy:
 *  - `hint: 'oss'` → OSS Llama via Together.
 *  - `budgetRemainingCents < 50` or `hint: 'cheap'` → Claude Haiku.
 *  - `agentKey` starts with `agent.` → Claude Sonnet (the default reasoning agent).
 *  - everything else → Claude Sonnet.
 */
export function defaultPolicy(): EnginePolicy {
  return {
    choose(input) {
      const requireChoice = (key: string): ModelChoice => {
        const choice = CATALOG[key];
        if (!choice) throw new Error(`Unknown model key '${key}'`);
        return choice;
      };
      if (input.hint === 'oss') return requireChoice('together-llama');
      if (input.hint === 'cheap') return requireChoice('claude-haiku');
      if (typeof input.budgetRemainingCents === 'number' && input.budgetRemainingCents < 50) {
        return requireChoice('claude-haiku');
      }
      if (input.hint === 'best') return requireChoice('claude-sonnet');
      if (input.agentKey.startsWith('agent.cheap.')) return requireChoice('claude-haiku');
      return requireChoice('claude-sonnet');
    },
  };
}

/** Return the catalog snapshot. Public so dashboards can introspect costs. */
export function modelCatalog(): Readonly<Record<string, ModelChoice>> {
  return CATALOG;
}
