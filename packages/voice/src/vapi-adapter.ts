import { VapiNotConfiguredError } from './types.js';
interface VapiConfig { apiKey?: string; baseUrl?: string }
interface CreateCallOpts { assistantId?: string; phoneNumberId?: string; customer: { number: string }; assistantOverrides?: Record<string, unknown> }
interface CreateAssistantOpts { name: string; model: Record<string, unknown>; voice: Record<string, unknown>; firstMessage: string }
export class VapiAdapter {
  private baseUrl: string;
  private apiKey: string | undefined;
  constructor(config: VapiConfig) {
    this.baseUrl = config.baseUrl ?? 'https://api.vapi.ai';
    this.apiKey = config.apiKey;
  }
  private headers() {
    if (!this.apiKey) throw new VapiNotConfiguredError();
    return { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' };
  }
  async createCall(opts: CreateCallOpts): Promise<{ callId: string }> {
    const res = await fetch(`${this.baseUrl}/call`, { method: 'POST', headers: this.headers(), body: JSON.stringify(opts) });
    const data = await res.json() as { id: string };
    return { callId: data.id };
  }
  async endCall(callId: string): Promise<void> {
    await fetch(`${this.baseUrl}/call/${callId}`, { method: 'DELETE', headers: this.headers() });
  }
  async createAssistant(opts: CreateAssistantOpts): Promise<{ assistantId: string }> {
    const res = await fetch(`${this.baseUrl}/assistant`, { method: 'POST', headers: this.headers(), body: JSON.stringify(opts) });
    const data = await res.json() as { id: string };
    return { assistantId: data.id };
  }
  async listPhoneNumbers(): Promise<Array<{ id: string; number: string }>> {
    const res = await fetch(`${this.baseUrl}/phone-number`, { headers: this.headers() });
    return res.json() as Promise<Array<{ id: string; number: string }>>;
  }
  async buyPhoneNumber(opts: { areaCode?: string; country?: string }): Promise<{ id: string; number: string }> {
    const res = await fetch(`${this.baseUrl}/phone-number/buy`, { method: 'POST', headers: this.headers(), body: JSON.stringify(opts) });
    const data = await res.json() as { id: string; number: string };
    return data;
  }
}
