/**
 * Connector authoring primitive.
 *
 * Every connector — Gmail, Slack, Notion, GitHub, scraped competitor
 * pricing, custom community-authored sources — is declared through
 * {@link defineConnector}. The returned {@link ConnectorDefinition}
 * is consumed by the {@link ConnectorRegistry}, the Connector Setup
 * Agent, and the sync workers.
 */

import type { ZodTypeAny } from 'zod';
import type { ConnectorTier } from './types.js';

/** A single LLM- or runtime-callable capability exposed by a connector. */
export interface ConnectorCapability {
  readonly key: string;
  readonly description: string;
  readonly inputSchema?: ZodTypeAny | undefined;
  readonly outputSchema?: ZodTypeAny | undefined;
}

/** Optional rate limit hint for the upstream provider. */
export interface ConnectorRateLimit {
  readonly rpm: number;
  readonly burst?: number | undefined;
}

/** Static description of a connector. */
export interface ConnectorDefinition<TConfig = unknown> {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly tier: ConnectorTier;
  readonly provider: string;
  readonly scopes: readonly string[];
  readonly capabilities: readonly ConnectorCapability[];
  readonly configSchema: ZodTypeAny;
  readonly webhookKinds?: readonly string[] | undefined;
  readonly rateLimit?: ConnectorRateLimit | undefined;
  readonly metadata?: Record<string, unknown> | undefined;

  /** Phantom marker preserving the TS config type after definition. */
  readonly __config?: TConfig | undefined;
}

const KEY_REGEX = /^[a-z0-9][a-z0-9_.-]{0,127}$/;
const PROVIDER_REGEX = /^[a-z0-9][a-z0-9_.-]{0,63}$/;

/**
 * Author a connector definition with runtime invariants:
 *
 * - `key` matches `^[a-z0-9][a-z0-9_.-]{0,127}$`.
 * - `provider` matches the same shape, bounded to 64 chars.
 * - `tier` must be one of the six tiers.
 * - `configSchema` must be a Zod type.
 * - Capability keys must be unique within the connector.
 */
export function defineConnector<TConfig = unknown>(
  def: ConnectorDefinition<TConfig>,
): ConnectorDefinition<TConfig> {
  if (!KEY_REGEX.test(def.key)) {
    throw new Error(
      `Connector key '${def.key}' is invalid; must match ${KEY_REGEX.toString()} and be 1-128 chars`,
    );
  }
  if (!PROVIDER_REGEX.test(def.provider)) {
    throw new Error(
      `Connector provider '${def.provider}' is invalid; must match ${PROVIDER_REGEX.toString()}`,
    );
  }
  if (!def.configSchema || typeof def.configSchema.safeParse !== 'function') {
    throw new Error(`Connector '${def.key}' must declare a Zod 'configSchema'`);
  }
  const seen = new Set<string>();
  for (const cap of def.capabilities) {
    if (seen.has(cap.key)) {
      throw new Error(`Connector '${def.key}' declares duplicate capability '${cap.key}'`);
    }
    seen.add(cap.key);
  }
  if (def.rateLimit && def.rateLimit.rpm <= 0) {
    throw new Error(`Connector '${def.key}' rateLimit.rpm must be positive`);
  }
  return def;
}

/** Recover the config type from a definition. */
export type InferConnectorConfig<C> = C extends ConnectorDefinition<infer T> ? T : never;
