/**
 * ConflictResolver — multi-source attribute reconciliation.
 *
 * When the same entity is observed from multiple sources with
 * differing attribute values, this module detects conflicts
 * and proposes resolutions using configurable strategies.
 */

import type { Db, Logger, ModelProvider, ConflictResolution } from './types.js';

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

export interface ConflictingFact {
  sourceRef: string;
  property: string;
  value: unknown;
  observedAt: string;
  confidence: number;
}

export interface EntityConflicts {
  entityId: string;
  workspaceId: string;
  conflicts: Array<{
    property: string;
    facts: ConflictingFact[];
  }>;
}

// ---------------------------------------------------------------------------
// Resolution strategies
// ---------------------------------------------------------------------------

export type ResolutionStrategy =
  | 'keep-latest'     // Use the most recently observed value
  | 'keep-highest-confidence' // Use the value from the highest-confidence source
  | 'merge'           // Combine values (for non-scalar properties)
  | 'escalate';       // Cannot auto-resolve; escalate to human

// ---------------------------------------------------------------------------
// ConflictResolver
// ---------------------------------------------------------------------------

export interface ConflictResolverDeps {
  db: Db;
  modelProvider?: ModelProvider;
  logger: Logger;
  defaultStrategy?: ResolutionStrategy;
}

export class ConflictResolver {
  private readonly db: Db;
  private readonly modelProvider: ModelProvider | undefined;
  private readonly logger: Logger;
  private readonly defaultStrategy: ResolutionStrategy;

  constructor(deps: ConflictResolverDeps) {
    this.db = deps.db;
    this.modelProvider = deps.modelProvider;
    this.logger = deps.logger;
    this.defaultStrategy = deps.defaultStrategy ?? 'keep-latest';
  }

  /**
   * Detect conflicts for an entity — find properties with multiple
   * differing values across sources.
   */
  detectConflicts(facts: ConflictingFact[]): EntityConflicts[] {
    // Group facts by (entityId, property)
    const byProperty = new Map<string, Map<string, ConflictingFact[]>>();

    for (const fact of facts) {
      const key = `${fact.sourceRef}::${fact.property}`;
      if (!byProperty.has(fact.property)) {
        byProperty.set(fact.property, new Map());
      }
      const propMap = byProperty.get(fact.property)!;
      if (!propMap.has(key)) {
        propMap.set(key, []);
      }
      propMap.get(key)!.push(fact);
    }

    const conflicts: EntityConflicts[] = [];

    for (const [property, sourceMap] of byProperty) {
      // Check if values differ
      const allFacts: ConflictingFact[] = [];
      const seenValues = new Set<string>();

      for (const factList of sourceMap.values()) {
        for (const f of factList) {
          allFacts.push(f);
          seenValues.add(JSON.stringify(f.value));
        }
      }

      if (seenValues.size > 1) {
        // There is a conflict — values differ
        conflicts.push({
          entityId: '', // Caller should fill in
          workspaceId: '', // Caller should fill in
          conflicts: [{
            property,
            facts: allFacts,
          }],
        });
      }
    }

    return conflicts;
  }

  /**
   * Resolve a conflict using the configured strategy.
   */
  async resolve(
    entityId: string,
    workspaceId: string,
    property: string,
    facts: ConflictingFact[],
    strategy?: ResolutionStrategy,
  ): Promise<ConflictResolution> {
    const strat = strategy ?? this.defaultStrategy;

    if (facts.length <= 1) {
      return {
        resolution: 'keep-latest',
        chosenValue: facts[0]?.value,
        rationale: 'Only one fact available; no conflict.',
      };
    }

    switch (strat) {
      case 'keep-latest': {
        const sorted = [...facts].sort((a, b) =>
          new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime(),
        );
        const latest = sorted[0]!;
        return {
          resolution: 'keep-latest',
          chosenValue: latest.value,
          rationale: `Most recent observation from ${latest.sourceRef} at ${latest.observedAt}`,
        };
      }

      case 'keep-highest-confidence': {
        const sorted = [...facts].sort((a, b) => b.confidence - a.confidence);
        const best = sorted[0]!;
        return {
          resolution: 'keep-latest',
          chosenValue: best.value,
          rationale: `Highest confidence source: ${best.sourceRef} (confidence=${best.confidence})`,
        };
      }

      case 'merge': {
        // Merge arrays/maps; for scalar values this doesn't make sense
        const values = facts.map((f) => f.value);
        if (values.every((v) => Array.isArray(v))) {
          const merged = [...new Set(values.flat())];
          return {
            resolution: 'merge',
            chosenValue: merged,
            rationale: 'Merged unique values from all sources',
          };
        }
        if (values.every((v) => typeof v === 'object' && v !== null && !Array.isArray(v))) {
          const merged: Record<string, unknown> = {};
          for (const v of values) {
            Object.assign(merged, v as Record<string, unknown>);
          }
          return {
            resolution: 'merge',
            chosenValue: merged,
            rationale: 'Merged object properties from all sources',
          };
        }
        // Fall through to escalate for non-mergeable types
        return {
          resolution: 'escalate',
          rationale: 'Cannot merge scalar values; human review required',
        };
      }

      case 'escalate': {
        // Try LLM disambiguation if available
        if (this.modelProvider) {
          return this.llmResolve(entityId, property, facts);
        }
        return {
          resolution: 'escalate',
          rationale: `Conflicting values for property "${property}": ${facts.map((f) => JSON.stringify(f.value)).join(', ')}. Human review required.`,
        };
      }

      default:
        return {
          resolution: 'escalate',
          rationale: `Unknown strategy: ${strat}`,
        };
    }
  }

  // -----------------------------------------------------------------------
  // LLM-assisted resolution (optional)
  // -----------------------------------------------------------------------

  private async llmResolve(
    entityId: string,
    property: string,
    facts: ConflictingFact[],
  ): Promise<ConflictResolution> {
    if (!this.modelProvider) {
      return {
        resolution: 'escalate',
        rationale: 'No LLM provider available for disambiguation',
      };
    }

    try {
      const candidates = facts.map((f, i) =>
        `${i + 1}. Source: ${f.sourceRef}, Value: ${JSON.stringify(f.value)}, Observed: ${f.observedAt}, Confidence: ${f.confidence}`,
      ).join('\n');

      const response = await this.modelProvider.send({
        model: 'conflict-resolver',
        system: `You resolve conflicting data about entities. Choose the best value or indicate that human review is needed. Reply with JSON: {"resolution":"merge"|"split"|"keep-latest"|"escalate","chosenValue":<value>,"rationale":"<reason>"}`,
        messages: [{
          role: 'user',
          content: `Entity ${entityId} has conflicting values for "${property}":\n${candidates}`,
        }],
        maxTokens: 200,
        temperature: 0,
      });

      const text = response.text?.trim() ?? '{}';
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;

      return {
        resolution: (parsed['resolution'] as ConflictResolution['resolution']) ?? 'escalate',
        chosenValue: parsed['chosenValue'],
        rationale: (parsed['rationale'] as string) ?? 'LLM-assisted resolution',
      };
    } catch (err) {
      this.logger.warn(`ConflictResolver: LLM resolution failed for entity=${entityId}`, { error: String(err) });
      return {
        resolution: 'escalate',
        rationale: `LLM resolution failed: ${String(err)}`,
      };
    }
  }
}
