/**
 * LineagePanel — build "why this answer" trace data.
 *
 * Given an AnswerResponse and the original query, traverse `lineage_edges`
 * backward from each cited source so the UI can render a provenance tree
 * (L2 → L1 → L0).
 */

import { randomUUID } from 'node:crypto';
import type {
  AnswerResponse,
  Db,
  LineageBackwardEdge,
  LineageSource,
  LineageTrace,
  Logger,
} from './types.js';

const DEFAULT_MAX_DEPTH = 4;

export interface LineagePanelDeps {
  db: Db;
  logger: Logger;
  maxDepth?: number;
}

export class LineagePanel {
  private readonly db: Db;
  private readonly logger: Logger;
  private readonly maxDepth: number;

  constructor(deps: LineagePanelDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
    this.maxDepth = deps.maxDepth ?? DEFAULT_MAX_DEPTH;
  }

  async buildTrace(
    answer: AnswerResponse,
    query: string,
    answerId: string = randomUUID(),
  ): Promise<LineageTrace> {
    const sources: LineageSource[] = [];

    for (const citation of answer.citations) {
      try {
        const backward = await this.walkBackward(citation.sourceLayer, citation.sourceId);
        sources.push({
          id: citation.sourceId,
          layer: citation.sourceLayer,
          relevance: citation.relevance,
          excerpt: citation.quote ?? '',
          lineageBackward: backward,
        });
      } catch (err) {
        this.logger.warn('LineagePanel: failed to walk lineage', {
          error: String(err),
          sourceId: citation.sourceId,
        });
        sources.push({
          id: citation.sourceId,
          layer: citation.sourceLayer,
          relevance: citation.relevance,
          excerpt: citation.quote ?? '',
          lineageBackward: [],
        });
      }
    }

    const trace: LineageTrace = {
      answerId,
      query,
      sources,
    };
    if (answer.confidence < 0.5) {
      trace.reasoning = `Low confidence (${answer.confidence.toFixed(2)}): the model flagged uncertainty.`;
    }
    return trace;
  }

  private async walkBackward(fromLayer: string, fromId: string): Promise<LineageBackwardEdge[]> {
    const visited = new Set<string>();
    const collected: LineageBackwardEdge[] = [];
    const queue: Array<{ layer: string; id: string; depth: number }> = [
      { layer: fromLayer, id: fromId, depth: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const key = `${current.layer}:${current.id}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (current.depth >= this.maxDepth) continue;

      const edges = await this.queryEdges(current.layer, current.id);
      for (const edge of edges) {
        collected.push(edge);
        queue.push({ layer: edge.layer, id: edge.id, depth: current.depth + 1 });
      }
    }

    return collected;
  }

  private async queryEdges(toLayer: string, toId: string): Promise<LineageBackwardEdge[]> {
    const rows = await this.db
      .select()
      .from('lineage_edges' as unknown as Record<string, unknown>)
      .where({ to_layer: toLayer, to_id: toId } as unknown as Record<string, unknown>);

    const edges: LineageBackwardEdge[] = [];
    for (const row of rows as unknown[]) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const layer = typeof r.from_layer === 'string' ? (r.from_layer as string) : '';
      const id = typeof r.from_id === 'string' ? (r.from_id as string) : '';
      const kind = typeof r.kind === 'string' ? (r.kind as string) : 'derived_from';
      if (layer && id) edges.push({ layer, id, kind });
    }
    return edges;
  }
}
