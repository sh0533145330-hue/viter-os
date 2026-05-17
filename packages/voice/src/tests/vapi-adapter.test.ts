import { describe, it, expect, vi, afterEach } from 'vitest';
import { VapiAdapter, VapiNotConfiguredError } from '../index.js';
describe('VapiAdapter', () => {
  afterEach(() => vi.restoreAllMocks());
  it('throws VapiNotConfiguredError when no apiKey', async () => {
    const adapter = new VapiAdapter({});
    await expect(adapter.createCall({ customer: { number: '+1555' } })).rejects.toThrow(VapiNotConfiguredError);
  });
  it('calls correct endpoint for createCall', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'call-123' })));
    const adapter = new VapiAdapter({ apiKey: 'test-key' });
    const result = await adapter.createCall({ customer: { number: '+1555' } });
    expect(result.callId).toBe('call-123');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/call'), expect.objectContaining({ method: 'POST' }));
  });
  it('sends correct auth header', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'a-1' })));
    const adapter = new VapiAdapter({ apiKey: 'sk-abc' });
    await adapter.createCall({ customer: { number: '+1555' } });
    const [, opts] = vi.mocked(fetch).mock.calls[0] ?? [];
    const headers = opts?.headers as Record<string, string>;
    expect(headers?.['Authorization']).toBe('Bearer sk-abc');
  });
});
