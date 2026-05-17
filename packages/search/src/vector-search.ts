/**
 * VectorSearch — pgvector cosine-distance queries with workspace RLS.
 *
 * Uses the injected `Db` contract (matches @vita/ontology's Db). Queries are
 * executed via `db.execute(sql)` to allow raw pgvector operators (`<=>`).
 * The workspace filter is always applied to enforce tenant isolation.
 */

import type { Db, EntityVectorHit, LayerKind, Logger, VectorHit } from './types.js';

export interface VectorSearchDeps {
  db: Db;
  logger: Logger;
}

const DEFAULT_LIMIT = 20;

function toVectorLiteral(vec: number[]): string {
  if (vec.length === 0) {
    throw new Error('VectorSearch: query vector must not be empty');
  }
  return `[${vec.join(',')}]`;
}

function distanceToScore(distance: number): number {
  // pgvector cosine distance is in [0, 2]; convert to a similarity in [0, 1].
  const sim = 1 - distance / 2;
  if (Number.isNaN(sim)) return 0;
  return Math.max(0, Math.min(1, sim));
}

export class VectorSearch {
  private readonly db: Db;
  private readonly logger: Logger;

  constructor(deps: VectorSearchDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
  }

  async searchL1(
    workspaceId: string,
    queryVector: number[],
    limit = DEFAULT_LIMIT,
  ): Promise<VectorHit[]> {
    const vec = toVectorLiteral(queryVector);
    const sql = {
      text: `SELECT id, body, embedding <=> $1 AS distance
             FROM l1_artifacts
             WHERE workspace_id = $2 AND embedding IS NOT NULL
             ORDER BY embedding <=> $1
             LIMIT $3`,
      values: [vec, workspaceId, limit],
    };

    try {
      const rows = await this.db.execute(sql);
      return this.mapL1Rows(rows);
    } catch (err) {
      this.logger.error('VectorSearch.searchL1: query failed', { error: String(err) });
      throw err;
    }
  }

  async searchEntities(
    workspaceId: string,
    queryVector: number[],
    limit = DEFAULT_LIMIT,
  ): Promise<EntityVectorHit[]> {
    const vec = toVectorLiteral(queryVector);
    const sql = {
      text: `SELECT id, name, kind, embedding <=> $1 AS distance
             FROM entities
             WHERE workspace_id = $2 AND embedding IS NOT NULL
             ORDER BY embedding <=> $1
             LIMIT $3`,
      values: [vec, workspaceId, limit],
    };

    try {
      const rows = await this.db.execute(sql);
      return this.mapEntityRows(rows);
    } catch (err) {
      this.logger.error('VectorSearch.searchEntities: query failed', { error: String(err) });
      throw err;
    }
  }

  async searchLayer(
    layer: LayerKind,
    workspaceId: string,
    queryVector: number[],
    limit = DEFAULT_LIMIT,
  ): Promise<VectorHit[]> {
    const tableMap: Record<LayerKind, string> = {
      l0: 'l0_artifacts',
      l1: 'l1_artifacts',
      l2: 'l2_artifacts',
      l3: 'l3_artifacts',
      l4: 'l4_artifacts',
    };
    const table = tableMap[layer];
    const vec = toVectorLiteral(queryVector);
    const sql = {
      text: `SELECT id, body, embedding <=> $1 AS distance
             FROM ${table}
             WHERE workspace_id = $2 AND embedding IS NOT NULL
             ORDER BY embedding <=> $1
             LIMIT $3`,
      values: [vec, workspaceId, limit],
    };

    try {
      const rows = await this.db.execute(sql);
      return this.mapL1Rows(rows, layer);
    } catch (err) {
      this.logger.error('VectorSearch.searchLayer: query failed', {
        error: String(err),
        layer,
      });
      throw err;
    }
  }

  private mapL1Rows(rows: unknown[], layer: LayerKind = 'l1'): VectorHit[] {
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      const id = String(r.id ?? '');
      const body = typeof r.body === 'string' ? (r.body as string) : '';
      const dist = typeof r.distance === 'number' ? (r.distance as number) : 1;
      return { id, body, layer, score: distanceToScore(dist) };
    });
  }

  private mapEntityRows(rows: unknown[]): EntityVectorHit[] {
    return rows.map((row) => {
      const r = row as Record<string, unknown>;
      const id = String(r.id ?? '');
      const name = typeof r.name === 'string' ? (r.name as string) : '';
      const dist = typeof r.distance === 'number' ? (r.distance as number) : 1;
      const hit: EntityVectorHit = { id, name, score: distanceToScore(dist) };
      if (typeof r.kind === 'string') hit.kind = r.kind as string;
      return hit;
    });
  }
}
