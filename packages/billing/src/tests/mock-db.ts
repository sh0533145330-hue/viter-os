import type { Db } from '../types.js';

export class MockDb implements Db {
  public calls: Array<{ sql: string; params: unknown[] }> = [];
  public rows: Record<string, unknown>[] = [];
  public nextRows: Array<Record<string, unknown>[]> = [];

  async query(sql: string, params: unknown[] = []): Promise<{ rows: Record<string, unknown>[] }> {
    this.calls.push({ sql, params });
    const next = this.nextRows.shift();
    if (next !== undefined) return { rows: next };
    return { rows: this.rows };
  }

  reset(): void {
    this.calls = [];
    this.rows = [];
    this.nextRows = [];
  }
}
