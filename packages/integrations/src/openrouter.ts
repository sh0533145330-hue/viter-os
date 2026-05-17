export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  embeddingModel?: string;
  appName?: string;
  appUrl?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResult {
  text: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export class OpenRouterClient {
  constructor(private cfg: OpenRouterConfig) {}

  private get baseUrl(): string {
    return this.cfg.baseUrl ?? 'https://openrouter.ai/api/v1';
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.cfg.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (this.cfg.appName) h['X-Title'] = this.cfg.appName;
    if (this.cfg.appUrl) h['HTTP-Referer'] = this.cfg.appUrl;
    return h;
  }

  async test(): Promise<{ ok: boolean; message: string; models?: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers() });
      if (!res.ok) return { ok: false, message: `OpenRouter: ${res.status} ${await res.text()}` };
      const json = (await res.json()) as { data?: unknown[] };
      const result: { ok: true; message: string; models?: number } = { ok: true, message: 'OpenRouter key valid.' };
      if (Array.isArray(json.data)) result.models = json.data.length;
      return result;
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async listModels(): Promise<Array<{ id: string; name: string; pricing?: { prompt: string; completion: string } }>> {
    const res = await fetch(`${this.baseUrl}/models`, { headers: this.headers() });
    if (!res.ok) throw new Error(`OpenRouter list models failed: ${res.status}`);
    const json = (await res.json()) as { data: Array<{ id: string; name?: string; pricing?: { prompt: string; completion: string } }> };
    return json.data.map(m => {
      const item: { id: string; name: string; pricing?: { prompt: string; completion: string } } = { id: m.id, name: m.name ?? m.id };
      if (m.pricing) item.pricing = m.pricing;
      return item;
    });
  }

  async chat(messages: ChatMessage[], opts: { model?: string; temperature?: number; maxTokens?: number } = {}): Promise<ChatCompletionResult> {
    const model = opts.model ?? this.cfg.defaultModel ?? 'anthropic/claude-3.5-sonnet';
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1024,
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter chat failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
      model: string;
    };
    const result: ChatCompletionResult = {
      text: json.choices[0]?.message.content ?? '',
      model: json.model,
    };
    if (json.usage) {
      result.usage = { promptTokens: json.usage.prompt_tokens, completionTokens: json.usage.completion_tokens };
    }
    return result;
  }

  async *chatStream(messages: ChatMessage[], opts: { model?: string; temperature?: number; maxTokens?: number } = {}): AsyncGenerator<string, void, void> {
    const model = opts.model ?? this.cfg.defaultModel ?? 'anthropic/claude-3.5-sonnet';
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1024,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) throw new Error(`OpenRouter stream failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) yield chunk;
        } catch {
          // ignore partial frames
        }
      }
    }
  }

  async embed(input: string | string[], opts: { model?: string } = {}): Promise<number[][]> {
    const model = opts.model ?? this.cfg.embeddingModel ?? 'openai/text-embedding-3-small';
    const inputs = Array.isArray(input) ? input : [input];
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ model, input: inputs }),
    });
    if (!res.ok) throw new Error(`OpenRouter embed failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return json.data.map(d => d.embedding);
  }
}
