/**
 * Tests for MeilisearchClient — verify HTTP shape via mocked fetch.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MeilisearchClient } from '../meilisearch-client.js';

interface MockCall {
  url: string;
  init: RequestInit;
}

let calls: MockCall[] = [];
let responses: Array<Response | Promise<Response>> = [];

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  calls = [];
  responses = [];
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) return Promise.resolve(jsonResponse({}));
    return Promise.resolve(next);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MeilisearchClient — config', () => {
  it('throws when url is missing', () => {
    expect(() => new MeilisearchClient({ url: '' })).toThrow(/url is required/);
  });

  it('strips trailing slashes from the url', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test/' });
    responses.push(jsonResponse({ taskUid: 1 }));
    await client.createIndex('items');
    expect(calls[0]?.url).toBe('http://meili.test/indexes');
  });

  it('sets Authorization header when apiKey is set', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test', apiKey: 'secret' });
    responses.push(jsonResponse({ taskUid: 1 }));
    await client.createIndex('items');
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer secret');
  });
});

describe('MeilisearchClient — documents', () => {
  it('addDocuments posts the array as JSON', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test' });
    responses.push(jsonResponse({ taskUid: 42 }));
    const res = await client.addDocuments('items', [{ id: '1', name: 'a' }]);
    expect(res.taskUid).toBe(42);
    expect(calls[0]?.url).toBe('http://meili.test/indexes/items/documents');
    expect(calls[0]?.init.method).toBe('POST');
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual([{ id: '1', name: 'a' }]);
  });

  it('deleteDocument issues DELETE', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test' });
    responses.push(jsonResponse({ taskUid: 7 }));
    const res = await client.deleteDocument('items', 'abc');
    expect(res.taskUid).toBe(7);
    expect(calls[0]?.init.method).toBe('DELETE');
    expect(calls[0]?.url).toBe('http://meili.test/indexes/items/documents/abc');
  });
});

describe('MeilisearchClient — search', () => {
  it('normalises hits into { _id, _score, ...rest }', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test' });
    responses.push(
      jsonResponse({
        hits: [
          { id: 'a', _rankingScore: 0.92, title: 'Alpha' },
          { id: 'b', _rankingScore: 0.81, title: 'Beta' },
        ],
        estimatedTotalHits: 2,
        processingTimeMs: 5,
        query: 'hello',
      }),
    );
    const res = await client.search('items', 'hello', { limit: 5 });
    expect(res.hits.length).toBe(2);
    expect(res.hits[0]?._id).toBe('a');
    expect(res.hits[0]?._score).toBe(0.92);
    expect(res.hits[0]?.title).toBe('Alpha');
    expect(res.estimatedTotalHits).toBe(2);
    expect(res.processingTimeMs).toBe(5);
  });

  it('forwards search options', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test' });
    responses.push(
      jsonResponse({ hits: [], estimatedTotalHits: 0, processingTimeMs: 1, query: 'q' }),
    );
    await client.search('items', 'q', {
      limit: 3,
      offset: 6,
      filter: 'tag = a',
      sort: ['ts:desc'],
    });
    const body = JSON.parse(calls[0]?.init.body as string);
    expect(body).toMatchObject({
      q: 'q',
      limit: 3,
      offset: 6,
      filter: 'tag = a',
      sort: ['ts:desc'],
    });
  });

  it('defaults to zero hits if Meili returns no hits field', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test' });
    responses.push(jsonResponse({ hits: [] }));
    const res = await client.search('items', 'q');
    expect(res.hits.length).toBe(0);
    expect(res.estimatedTotalHits).toBe(0);
  });
});

describe('MeilisearchClient — settings & keys', () => {
  it('updateSettings PATCHes the settings payload', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test' });
    responses.push(jsonResponse({ taskUid: 1 }));
    await client.updateSettings('items', { synonyms: { ny: ['new york'] }, stopWords: ['the'] });
    expect(calls[0]?.init.method).toBe('PATCH');
    expect(calls[0]?.url).toBe('http://meili.test/indexes/items/settings');
    const body = JSON.parse(calls[0]?.init.body as string);
    expect(body.synonyms.ny).toEqual(['new york']);
  });

  it('createApiKey serialises expiresAt as ISO string', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test' });
    responses.push(jsonResponse({ key: 'k', uid: 'u' }));
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const res = await client.createApiKey({
      description: 'tenant ws-1',
      indexes: ['l1_artifacts_ws-1'],
      actions: ['search'],
      expiresAt,
    });
    expect(res.key).toBe('k');
    const body = JSON.parse(calls[0]?.init.body as string);
    expect(body.expiresAt).toBe('2030-01-01T00:00:00.000Z');
  });

  it('createApiKey sends expiresAt: null when not provided', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test' });
    responses.push(jsonResponse({ key: 'k', uid: 'u' }));
    await client.createApiKey({ description: 'x', indexes: ['*'], actions: ['search'] });
    const body = JSON.parse(calls[0]?.init.body as string);
    expect(body.expiresAt).toBeNull();
  });
});

describe('MeilisearchClient — errors', () => {
  it('throws when Meilisearch returns non-2xx', async () => {
    const client = new MeilisearchClient({ url: 'http://meili.test' });
    responses.push(
      new Response('boom', { status: 500, headers: { 'content-type': 'text/plain' } }),
    );
    await expect(client.createIndex('items')).rejects.toThrow(/HTTP 500/);
  });
});
