/**
 * EmbeddingPipeline — compute pgvector embeddings via model.
 *
 * Generates vector embeddings for L1 artifacts and entities
 * and writes them to the corresponding tables. Uses an
 * injectable EmbeddingProvider so tests can use MockEmbeddingProvider.
 */

import type { Db, Logger, EmbeddingProvider } from './types.js';

// ---------------------------------------------------------------------------
// EmbeddingProvider implementations
// ---------------------------------------------------------------------------

/**
 * MockEmbeddingProvider for tests.
 * Returns deterministic vectors based on text content.
 * No real API calls.
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions: number;

  constructor(dimensions = 1536) {
    this.dimensions = dimensions;
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    return texts.map((text) => {
      const vec = new Float32Array(this.dimensions);
      // Deterministic: use char codes to seed the vector
      for (let i = 0; i < this.dimensions; i++) {
        const charCode = text.charCodeAt(i % text.length) || 0;
        // Normalise to [-1, 1] range
        vec[i] = ((charCode * (i + 1)) % 255 - 127) / 127;
      }
      // Normalise the vector
      let norm = 0;
      for (let i = 0; i < vec.length; i++) {
        norm += vec[i]! * vec[i]!;
      }
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let i = 0; i < vec.length; i++) {
          vec[i] = vec[i]! / norm;
        }
      }
      return vec;
    });
  }
}

// ---------------------------------------------------------------------------
// EmbeddingPipeline
// ---------------------------------------------------------------------------

export interface EmbeddingPipelineDeps {
  provider: EmbeddingProvider;
  db: Db;
  logger: Logger;
}

export interface EmbedItem {
  id: string;
  text: string;
  table: 'l1' | 'entity';
}

export class EmbeddingPipeline {
  private readonly provider: EmbeddingProvider;
  private readonly db: Db;
  private readonly logger: Logger;

  constructor(deps: EmbeddingPipelineDeps) {
    this.provider = deps.provider;
    this.db = deps.db;
    this.logger = deps.logger;
  }

  /**
   * Compute and write an embedding for an L1 artifact.
   */
  async embedL1(l1Id: string, body: string): Promise<void> {
    const [embedding] = await this.provider.embed([body]);
    try {
      await this.db
        .update('l1_artifacts' as unknown as Record<string, unknown>)
        .set({ embedding: embedding! })
        .where({ id: l1Id } as unknown as unknown);
      this.logger.info(`EmbeddingPipeline: embedded L1 artifact id=${l1Id}`);
    } catch (err) {
      this.logger.error(`EmbeddingPipeline: failed to write L1 embedding id=${l1Id}`, { error: String(err) });
      throw err;
    }
  }

  /**
   * Compute and write an embedding for an entity.
   */
  async embedEntity(entityId: string, text: string): Promise<void> {
    const [embedding] = await this.provider.embed([text]);
    try {
      await this.db
        .update('entities' as unknown as Record<string, unknown>)
        .set({ embedding: embedding! })
        .where({ id: entityId } as unknown as unknown);
      this.logger.info(`EmbeddingPipeline: embedded entity id=${entityId}`);
    } catch (err) {
      this.logger.error(`EmbeddingPipeline: failed to write entity embedding id=${entityId}`, { error: String(err) });
      throw err;
    }
  }

  /**
   * Batch embed multiple items.
   * Returns the number of items successfully embedded.
   */
  async batchEmbed(items: EmbedItem[]): Promise<number> {
    if (items.length === 0) return 0;

    const texts = items.map((item) => item.text);
    const embeddings = await this.provider.embed(texts);

    let successCount = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const embedding = embeddings[i]!;
      try {
        const tableName = item.table === 'l1' ? 'l1_artifacts' : 'entities';
        await this.db
          .update(tableName as unknown as Record<string, unknown>)
          .set({ embedding })
          .where({ id: item.id } as unknown as unknown);
        successCount++;
      } catch (err) {
        this.logger.warn(`EmbeddingPipeline: batch embed failed for ${item.table} id=${item.id}`, { error: String(err) });
      }
    }

    this.logger.info(`EmbeddingPipeline: batch embedded ${successCount}/${items.length} items`);
    return successCount;
  }
}
