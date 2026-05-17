/**
 * SearchIndexer — helpers for Meilisearch + pgvector index sync.
 *
 * Provides methods to index L1 artifacts and entities into
 * Meilisearch for full-text search, and to keep pgvector
 * embeddings in sync. Meilisearch operations are no-ops if
 * URL not configured.
 */

import type { Db, Logger, SearchIndexEntry } from './types.js';

// ---------------------------------------------------------------------------
// SearchIndexer
// ---------------------------------------------------------------------------

export interface SearchIndexerDeps {
  meilisearchUrl?: string;
  db: Db;
  logger: Logger;
}

export class SearchIndexer {
  private readonly meilisearchUrl: string | undefined;
  private readonly db: Db;
  private readonly logger: Logger;

  constructor(deps: SearchIndexerDeps) {
    this.meilisearchUrl = deps.meilisearchUrl;
    this.db = deps.db;
    this.logger = deps.logger;
  }

  /**
   * Index an L1 artifact into Meilisearch.
   *
   * Constructs the search document from the artifact data and
   * sends it to the appropriate Meilisearch index.
   * No-op if Meilisearch URL is not configured.
   */
  async indexL1(workspaceId: string, l1Id: string, data: Record<string, unknown>): Promise<void> {
    if (!this.meilisearchUrl) {
      this.logger.debug?.('SearchIndexer: Meilisearch not configured; skipping L1 index');
      return;
    }

    const indexName = `l1_artifacts_${workspaceId}`;
    const entry: SearchIndexEntry = {
      indexName,
      id: l1Id,
      data,
    };

    try {
      await this.sendToMeilisearch(entry);
      this.logger.info(`SearchIndexer: indexed L1 id=${l1Id} in ${indexName}`);
    } catch (err) {
      this.logger.warn(`SearchIndexer: failed to index L1 id=${l1Id}`, { error: String(err) });
    }
  }

  /**
   * Index an entity into Meilisearch.
   *
   * No-op if Meilisearch URL is not configured.
   */
  async indexEntity(workspaceId: string, entityId: string, data: Record<string, unknown>): Promise<void> {
    if (!this.meilisearchUrl) {
      this.logger.debug?.('SearchIndexer: Meilisearch not configured; skipping entity index');
      return;
    }

    const indexName = `entities_${workspaceId}`;
    const entry: SearchIndexEntry = {
      indexName,
      id: entityId,
      data,
    };

    try {
      await this.sendToMeilisearch(entry);
      this.logger.info(`SearchIndexer: indexed entity id=${entityId} in ${indexName}`);
    } catch (err) {
      this.logger.warn(`SearchIndexer: failed to index entity id=${entityId}`, { error: String(err) });
    }
  }

  /**
   * Remove a document from a Meilisearch index.
   *
   * No-op if Meilisearch URL is not configured.
   */
  async deindex(indexName: string, id: string): Promise<void> {
    if (!this.meilisearchUrl) {
      this.logger.debug?.('SearchIndexer: Meilisearch not configured; skipping deindex');
      return;
    }

    try {
      const url = `${this.meilisearchUrl}/indexes/${indexName}/documents/${id}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) {
        this.logger.warn(`SearchIndexer: deindex failed for ${indexName}/${id}: HTTP ${response.status}`);
      } else {
        this.logger.info(`SearchIndexer: deindexed id=${id} from ${indexName}`);
      }
    } catch (err) {
      this.logger.warn(`SearchIndexer: deindex request failed for ${indexName}/${id}`, { error: String(err) });
    }
  }

  // -----------------------------------------------------------------------
  // Internal: Meilisearch HTTP calls
  // -----------------------------------------------------------------------

  private async sendToMeilisearch(entry: SearchIndexEntry): Promise<void> {
    if (!this.meilisearchUrl) return;

    const url = `${this.meilisearchUrl}/indexes/${entry.indexName}/documents`;
    const doc = { id: entry.id, ...entry.data };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([doc]),
    });

    if (!response.ok) {
      throw new Error(`Meilisearch returned HTTP ${response.status}: ${await response.text()}`);
    }
  }
}
