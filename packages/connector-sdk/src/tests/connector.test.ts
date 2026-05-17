import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineConnector } from '../connector.js';
import { ConnectorRegistry, createConnectorRegistry } from '../registry.js';

const baseDef = {
  name: 'Gmail',
  description: 'Read and send mail through Gmail.',
  tier: 'oauth-nango' as const,
  provider: 'google',
  scopes: ['https://www.googleapis.com/auth/gmail.modify'],
  capabilities: [
    { key: 'read-messages', description: 'List messages' },
    { key: 'send-message', description: 'Send a message' },
  ],
  configSchema: z.object({ accountEmail: z.string().email() }),
};

describe('defineConnector', () => {
  it('accepts a well-formed connector', () => {
    const c = defineConnector({ key: 'google-gmail', ...baseDef });
    expect(c.key).toBe('google-gmail');
    expect(c.capabilities).toHaveLength(2);
  });

  it('rejects invalid keys', () => {
    expect(() => defineConnector({ key: 'INVALID KEY', ...baseDef })).toThrow(/invalid/i);
  });

  it('rejects invalid provider strings', () => {
    expect(() =>
      defineConnector({ key: 'gmail', ...baseDef, provider: 'NOT VALID' }),
    ).toThrow(/provider/);
  });

  it('rejects duplicate capability keys', () => {
    expect(() =>
      defineConnector({
        key: 'gmail',
        ...baseDef,
        capabilities: [
          { key: 'read-messages', description: 'a' },
          { key: 'read-messages', description: 'b' },
        ],
      }),
    ).toThrow(/duplicate capability/);
  });

  it('rejects non-Zod configSchema', () => {
    expect(() =>
      defineConnector({
        key: 'gmail',
        ...baseDef,
        configSchema: {} as unknown as z.ZodTypeAny,
      }),
    ).toThrow(/configSchema/);
  });

  it('rejects non-positive rate limits', () => {
    expect(() =>
      defineConnector({
        key: 'gmail',
        ...baseDef,
        rateLimit: { rpm: 0 },
      }),
    ).toThrow(/rateLimit/);
  });
});

describe('ConnectorRegistry', () => {
  const def = defineConnector({ key: 'google-gmail', ...baseDef });
  const slack = defineConnector({
    key: 'slack',
    name: 'Slack',
    description: 'Slack chat.',
    tier: 'oauth-nango',
    provider: 'slack',
    scopes: [],
    capabilities: [],
    configSchema: z.object({}),
  });

  it('registers and retrieves connectors', () => {
    const r = createConnectorRegistry();
    r.register(def);
    expect(r.get('google-gmail')).toBe(def);
    expect(r.has('google-gmail')).toBe(true);
    expect(r.size()).toBe(1);
  });

  it('rejects duplicate registrations', () => {
    const r = new ConnectorRegistry();
    r.register(def);
    expect(() => r.register(def)).toThrow(/already registered/);
  });

  it('filters by tier and provider', () => {
    const r = createConnectorRegistry();
    r.registerAll([def, slack]);
    expect(r.list({ provider: 'google' })).toEqual([def]);
    expect(r.list({ provider: 'slack' })).toEqual([slack]);
    expect(r.list({ tier: 'oauth-nango' })).toHaveLength(2);
    expect(r.list({ tier: 'scraper' })).toHaveLength(0);
  });

  it('unregisters connectors', () => {
    const r = createConnectorRegistry();
    r.register(def);
    expect(r.unregister('google-gmail')).toBe(true);
    expect(r.unregister('google-gmail')).toBe(false);
  });
});
