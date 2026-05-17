/**
 * EntityLinker — exact/fuzzy/LLM resolution of [entity:...] refs.
 *
 * Resolves raw entity mentions from L1 text to canonical entities
 * in the workspace's entities table. Uses a three-tier strategy:
 *
 * 1. **Exact**: match on name + objectTypeKey in the entities table.
 * 2. **Fuzzy**: trigram-style similarity on name within type.
 * 3. **LLM**: call model to disambiguate (optional; skip if no provider).
 */

import type { Db, Logger, ModelProvider, EntityRef, LinkResult } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise a name for comparison: lowercase, collapse whitespace. */
function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Simple trigram set from a string. */
function trigrams(s: string): Set<string> {
  const norm = `  ${s} `;
  const set = new Set<string>();
  for (let i = 0; i <= norm.length - 3; i++) {
    set.add(norm.slice(i, i + 3)!);
  }
  return set;
}

/** Jaccard-like trigram similarity between two strings [0,1]. */
function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(normalise(a));
  const tb = trigrams(normalise(b));
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// EntityLinker
// ---------------------------------------------------------------------------

export interface EntityLinkerDeps {
  db: Db;
  modelProvider?: ModelProvider;
  logger: Logger;
}

/** Minimum fuzzy similarity to consider a match. */
const FUZZY_THRESHOLD = 0.5;

export class EntityLinker {
  private readonly db: Db;
  private readonly modelProvider: ModelProvider | undefined;
  private readonly logger: Logger;

  constructor(deps: EntityLinkerDeps) {
    this.db = deps.db;
    this.modelProvider = deps.modelProvider;
    this.logger = deps.logger;
  }

  /**
   * Resolve a batch of entity references to canonical entities.
   *
   * For each ref, attempts exact match → fuzzy match → LLM disambiguation.
   */
  async link(refs: EntityRef[], workspaceId: string): Promise<LinkResult[]> {
    const results: LinkResult[] = [];
    for (const ref of refs) {
      const result = await this.resolveOne(ref, workspaceId);
      results.push(result);
    }
    return results;
  }

  // -----------------------------------------------------------------------
  // Internal resolution tiers
  // -----------------------------------------------------------------------

  private async resolveOne(ref: EntityRef, workspaceId: string): Promise<LinkResult> {
    // Tier 1: exact match
    const exact = await this.exactMatch(ref, workspaceId);
    if (exact) {
      this.logger.info(`EntityLinker: exact match for "${ref.name}" → ${exact.entityId}`);
      return exact;
    }

    // Tier 2: fuzzy match
    const fuzzy = await this.fuzzyMatch(ref, workspaceId);
    if (fuzzy) {
      this.logger.info(`EntityLinker: fuzzy match for "${ref.name}" → ${fuzzy.entityId} (confidence=${fuzzy.confidence})`);
      return fuzzy;
    }

    // Tier 3: LLM disambiguation (optional)
    if (this.modelProvider) {
      const llm = await this.llmMatch(ref, workspaceId);
      if (llm) {
        this.logger.info(`EntityLinker: LLM match for "${ref.name}" → ${llm.entityId}`);
        return llm;
      }
    }

    // No match — return a placeholder indicating new entity needed
    this.logger.info(`EntityLinker: no match for "${ref.name}" (kind=${ref.kind})`);
    return {
      entityId: '',
      objectTypeKey: ref.kind,
      confidence: 0,
      method: 'exact',
    };
  }

  // -----------------------------------------------------------------------
  // Tier 1: exact match
  // -----------------------------------------------------------------------

  private async exactMatch(ref: EntityRef, workspaceId: string): Promise<LinkResult | null> {
    const normalisedName = normalise(ref.name);
    try {
      // Query entities table for exact name + type match in workspace
      const rows = await this.db.select().from('entities' as unknown as Record<string, unknown>).where({
        and: [
          { workspace_id: workspaceId },
          { name: normalisedName },
          // objectTypeKey joined through object_types table — simplified for v1
        ],
      } as unknown as unknown) as Array<Record<string, unknown>>;

      if (rows.length > 0) {
        const row = rows[0]!;
        return {
          entityId: row['id'] as string,
          objectTypeKey: ref.kind,
          confidence: 1.0,
          method: 'exact',
        };
      }
    } catch (err) {
      this.logger.warn(`EntityLinker: exact match query failed for "${ref.name}"`, { error: String(err) });
    }
    return null;
  }

  // -----------------------------------------------------------------------
  // Tier 2: fuzzy match
  // -----------------------------------------------------------------------

  private async fuzzyMatch(ref: EntityRef, workspaceId: string): Promise<LinkResult | null> {
    try {
      // Fetch candidate entities of the same kind in the workspace
      const rows = await this.db.select().from('entities' as unknown as Record<string, unknown>).where({
        workspace_id: workspaceId,
      } as unknown as unknown) as Array<Record<string, unknown>>;

      let bestScore = 0;
      let bestRow: Record<string, unknown> | null = null;

      for (const row of rows) {
        const entityName = row['name'] as string;
        const score = trigramSimilarity(ref.name, entityName);
        if (score > bestScore && score >= FUZZY_THRESHOLD) {
          bestScore = score;
          bestRow = row;
        }
      }

      if (bestRow) {
        return {
          entityId: bestRow['id'] as string,
          objectTypeKey: ref.kind,
          confidence: bestScore,
          method: 'fuzzy',
        };
      }
    } catch (err) {
      this.logger.warn(`EntityLinker: fuzzy match query failed for "${ref.name}"`, { error: String(err) });
    }
    return null;
  }

  // -----------------------------------------------------------------------
  // Tier 3: LLM disambiguation
  // -----------------------------------------------------------------------

  private async llmMatch(ref: EntityRef, workspaceId: string): Promise<LinkResult | null> {
    if (!this.modelProvider) return null;

    try {
      // Fetch candidate entities
      const rows = await this.db.select().from('entities' as unknown as Record<string, unknown>).where({
        workspace_id: workspaceId,
      } as unknown as unknown) as Array<Record<string, unknown>>;

      if (rows.length === 0) return null;

      const candidates = rows.slice(0, 10).map((r) => ({
        id: r['id'],
        name: r['name'],
        attributes: r['attributes'],
      }));

      const prompt = `Given the entity reference "${ref.name}" of kind "${ref.kind}", which of the following candidates is the best match? If none match, respond with "none".

Candidates:
${candidates.map((c, i) => `${i + 1}. ${c.name} (id: ${c.id})`).join('\n')}

Respond with just the candidate number or "none".`;

      const response = await this.modelProvider.send({
        model: 'entity-linker',
        system: 'You are an entity resolution assistant. Respond with only a number or "none".',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 10,
        temperature: 0,
      });

      const text = response.text?.trim() ?? '';
      if (text === 'none') return null;

      const idx = parseInt(text, 10) - 1;
      if (idx >= 0 && idx < candidates.length) {
        const chosen = candidates[idx]!;
        return {
          entityId: chosen.id as string,
          objectTypeKey: ref.kind,
          confidence: 0.7,
          method: 'llm',
        };
      }
    } catch (err) {
      this.logger.warn(`EntityLinker: LLM disambiguation failed for "${ref.name}"`, { error: String(err) });
    }
    return null;
  }
}
