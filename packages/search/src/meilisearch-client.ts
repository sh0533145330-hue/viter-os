/**
 * Meilisearch HTTP client wrapper.
 *
 * Uses the native `fetch` API; no external SDK.
 * Designed for unit testing with `vi.spyOn(globalThis, 'fetch')`.
 */

import type {
  ApiKeyOptions,
  ApiKeyResponse,
  IndexSettings,
  MeilisearchConfig,
  MeilisearchHit,
  SearchOptions,
  SearchResponse,
} from './types.js';

interface MeiliTaskResponse {
  taskUid: number;
  indexUid?: string;
  status?: string;
  type?: string;
}

interface MeiliSearchRaw {
  hits: Array<Record<string, unknown>>;
  estimatedTotalHits?: number;
  processingTimeMs?: number;
  query?: string;
}

export class MeilisearchClient {
  private readonly url: string;
  private readonly apiKey: string | undefined;

  constructor(config: MeilisearchConfig) {
    if (!config.url) {
      throw new Error('MeilisearchClient: url is required');
    }
    this.url = config.url.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
  }

  async createIndex(name: string, primaryKey?: string): Promise<void> {
    const body: Record<string, string> = { uid: name };
    if (primaryKey !== undefined) body.primaryKey = primaryKey;
    await this.request('POST', '/indexes', body);
  }

  async deleteIndex(name: string): Promise<void> {
    await this.request('DELETE', `/indexes/${encodeURIComponent(name)}`);
  }

  async addDocuments(
    indexName: string,
    docs: Record<string, unknown>[],
  ): Promise<{ taskUid: number }> {
    const res = await this.request<MeiliTaskResponse>(
      'POST',
      `/indexes/${encodeURIComponent(indexName)}/documents`,
      docs,
    );
    return { taskUid: res.taskUid };
  }

  async deleteDocument(indexName: string, id: string): Promise<{ taskUid: number }> {
    const res = await this.request<MeiliTaskResponse>(
      'DELETE',
      `/indexes/${encodeURIComponent(indexName)}/documents/${encodeURIComponent(id)}`,
    );
    return { taskUid: res.taskUid };
  }

  async search(
    indexName: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResponse> {
    const body: Record<string, unknown> = { q: query, showRankingScore: true };
    if (options.limit !== undefined) body.limit = options.limit;
    if (options.offset !== undefined) body.offset = options.offset;
    if (options.filter !== undefined) body.filter = options.filter;
    if (options.sort !== undefined) body.sort = options.sort;
    if (options.attributesToHighlight !== undefined) {
      body.attributesToHighlight = options.attributesToHighlight;
    }
    if (options.attributesToRetrieve !== undefined) {
      body.attributesToRetrieve = options.attributesToRetrieve;
    }

    const raw = await this.request<MeiliSearchRaw>(
      'POST',
      `/indexes/${encodeURIComponent(indexName)}/search`,
      body,
    );

    const hits: MeilisearchHit[] = (raw.hits ?? []).map((doc) => {
      const id = String(doc.id ?? doc._id ?? '');
      const rawScore = doc._rankingScore;
      const score = typeof rawScore === 'number' ? rawScore : 0;
      return { ...doc, _id: id, _score: score };
    });

    return {
      hits,
      estimatedTotalHits: raw.estimatedTotalHits ?? hits.length,
      processingTimeMs: raw.processingTimeMs ?? 0,
      query: raw.query ?? query,
    };
  }

  async updateSettings(indexName: string, settings: IndexSettings): Promise<void> {
    await this.request('PATCH', `/indexes/${encodeURIComponent(indexName)}/settings`, settings);
  }

  async createApiKey(opts: ApiKeyOptions): Promise<ApiKeyResponse> {
    const body: Record<string, unknown> = {
      description: opts.description,
      indexes: opts.indexes,
      actions: opts.actions,
    };
    if (opts.expiresAt) body.expiresAt = opts.expiresAt.toISOString();
    else body.expiresAt = null;

    const res = await this.request<{ key: string; uid: string }>('POST', '/keys', body);
    return { key: res.key, uid: res.uid };
  }

  async health(): Promise<{ status: string }> {
    return this.request<{ status: string }>('GET', '/health');
  }

  private async request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    const response = await fetch(`${this.url}${path}`, init);
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Meilisearch ${method} ${path} failed: HTTP ${response.status} ${text}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return undefined as T;
  }
}
