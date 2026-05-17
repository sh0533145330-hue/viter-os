import { describe, it, expect } from 'vitest';
import { OpenRouterClient } from './openrouter.js';
import { NangoClient, NANGO_PROVIDER_REGISTRY } from './nango.js';
import { GenericRestConnector } from './connectors/rest-connector.js';
import { SCHEMA_SQL } from './supabase.js';

describe('@vita/integrations', () => {
  it('exports OpenRouterClient', () => {
    expect(OpenRouterClient).toBeDefined();
    const client = new OpenRouterClient({ apiKey: 'test' });
    expect(client).toBeInstanceOf(OpenRouterClient);
  });

  it('exports NangoClient', () => {
    expect(NangoClient).toBeDefined();
    const client = new NangoClient({ secretKey: 'test' });
    expect(client).toBeInstanceOf(NangoClient);
  });

  it('NANGO_PROVIDER_REGISTRY has known providers', () => {
    expect(NANGO_PROVIDER_REGISTRY['notion']).toBeDefined();
    expect(NANGO_PROVIDER_REGISTRY['slack']).toBeDefined();
    expect(NANGO_PROVIDER_REGISTRY['github']).toBeDefined();
    expect(Object.keys(NANGO_PROVIDER_REGISTRY).length).toBeGreaterThan(5);
  });

  it('GenericRestConnector rejects non-rest source config', async () => {
    const conn = new GenericRestConnector();
    const result = await conn.test({ tier: 'nango', kind: 'notion' });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Not a REST source');
  });

  it('SCHEMA_SQL contains expected tables', () => {
    expect(SCHEMA_SQL).toContain('entities');
    expect(SCHEMA_SQL).toContain('sources');
    expect(SCHEMA_SQL).toContain('messages');
  });
});
