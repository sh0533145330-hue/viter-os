export interface IdempotencyStore {
  has(key: string): Promise<boolean>;
  record(key: string, ttlSeconds: number): Promise<void>;
}

interface Entry {
  key: string;
  expiresAt: number;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly entries: Map<string, Entry> = new Map();

  async has(key: string): Promise<boolean> {
    this.evict();
    return this.entries.has(key);
  }

  async record(key: string, ttlSeconds: number): Promise<void> {
    this.entries.set(key, {
      key,
      expiresAt: Date.now() + Math.max(1, ttlSeconds) * 1000,
    });
  }

  size(): number {
    this.evict();
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  private evict(): void {
    const now = Date.now();
    for (const [k, v] of this.entries.entries()) {
      if (v.expiresAt <= now) this.entries.delete(k);
    }
  }
}
