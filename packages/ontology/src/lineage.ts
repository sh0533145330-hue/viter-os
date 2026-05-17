/**
 * LineageScribe — generate lineage_edges for every L2 write.
 *
 * Records the provenance of every fact, entity, and link so that
 * downstream citations and audit trails stay accurate. Each write
 * to L2 (entities, entity_links, entity_actions) generates one or
 * more lineage_edges from the upstream L0/L1 artifacts.
 */

import type { Db, Logger, LayerRef } from './types.js';

// ---------------------------------------------------------------------------
// Lineage edge types
// ---------------------------------------------------------------------------

export const LINEAGE_KINDS = {
  /** L0 → L1: extraction produced an L1 from an L0 */
  EXTRACTED_FROM: 'extracted_from',
  /** L1 → L2: entity was created/updated from an L1 */
  DERIVED_FROM: 'derived_from',
  /** L1 → L2: entity link was created from an L1 */
  LINKED_FROM: 'linked_from',
  /** L1 → L2: action was inferred from an L1 */
  INFERRED_FROM: 'inferred_from',
  /** L2 → L2: entity was resolved/merged from another entity */
  RESOLVED_FROM: 'resolved_from',
  /** L2 → L2: conflict was resolved producing a new value */
  CONFLICT_RESOLVED: 'conflict_resolved',
  /** Any → any: re-derivation */
  REDERIVED_FROM: 'rederived_from',
} as const;

export type LineageKind = (typeof LINEAGE_KINDS)[keyof typeof LINEAGE_KINDS];

// ---------------------------------------------------------------------------
// LineageScribe
// ---------------------------------------------------------------------------

export interface LineageScribeDeps {
  db: Db;
  logger: Logger;
}

export interface LineageEdgeInput {
  from: LayerRef;
  to: LayerRef;
  kind: string;
  attrs?: Record<string, unknown> | undefined;
}

export class LineageScribe {
  private readonly db: Db;
  private readonly logger: Logger;

  constructor(deps: LineageScribeDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
  }

  /**
   * Write a single lineage edge.
   */
  async writeEdge(
    from: LayerRef,
    to: LayerRef,
    kind: string,
    attrs?: Record<string, unknown>,
  ): Promise<void> {
    await this.writeEdges([{ from, to, kind, attrs }]);
  }

  /**
   * Write multiple lineage edges in a batch.
   */
  async writeEdges(edges: LineageEdgeInput[]): Promise<void> {
    if (edges.length === 0) return;

    try {
      const rows = edges.map((e) => ({
        from_layer: e.from.layer,
        from_id: e.from.id,
        to_layer: e.to.layer,
        to_id: e.to.id,
        edge_kind: e.kind,
        attributes: e.attrs ?? {},
      }));

      await this.db.insert('lineage_edges' as unknown as Record<string, unknown>).values(
        ...rows,
      );

      this.logger.info(`LineageScribe: wrote ${edges.length} lineage edge(s)`);
    } catch (err) {
      this.logger.error(`LineageScribe: failed to write lineage edges`, { error: String(err) });
      throw err;
    }
  }

  /**
   * Traverse lineage backward from a given node.
   * Returns all upstream ancestors (L0 → L1 → ... → given node).
   */
  async traverseBackward(
    toLayer: string,
    toId: string,
  ): Promise<Array<{ layer: string; id: string; kind: string }>> {
    const result: Array<{ layer: string; id: string; kind: string }> = [];
    const visited = new Set<string>();
    const queue: Array<{ layer: string; id: string }> = [{ layer: toLayer, id: toId }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.layer}:${current.id}`;
      if (visited.has(key)) continue;
      visited.add(key);

      try {
        const edges = await this.db
          .select()
          .from('lineage_edges' as unknown as Record<string, unknown>)
          .where({
            to_layer: current.layer,
            to_id: current.id,
          } as unknown as unknown) as Array<Record<string, unknown>>;

        for (const edge of edges) {
          const fromLayer = edge['from_layer'] as string;
          const fromId = edge['from_id'] as string;
          const kind = edge['edge_kind'] as string;

          result.push({ layer: fromLayer, id: fromId, kind });
          queue.push({ layer: fromLayer, id: fromId });
        }
      } catch (err) {
        this.logger.warn(`LineageScribe: backward traversal query failed at ${key}`, { error: String(err) });
        break;
      }
    }

    return result;
  }
}
