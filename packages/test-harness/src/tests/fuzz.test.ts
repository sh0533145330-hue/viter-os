import { describe, expect, it } from 'vitest';
import {
  AnonymizationFuzz,
  CrossTenantFuzz,
  PII_PATTERNS,
  PiiRedactionFuzz,
  type Row,
  generatePiiPayloads,
} from '../fuzz/index.js';

describe('CrossTenantFuzz', () => {
  it('reports zero leaks for an isolated query function', async () => {
    const fuzz = new CrossTenantFuzz({
      tables: ['inbox_items', 'agent_runs'],
      workspaces: ['ws-A', 'ws-B'],
      variantsPerEndpoint: 2,
    });

    const report = await fuzz.run((_table, caller) => [
      { workspace_id: caller, id: 'row-1' },
      { workspace_id: caller, id: 'row-2' },
    ]);

    expect(report.passed).toBe(true);
    expect(report.leaks).toHaveLength(0);
    expect(report.tablesChecked).toBe(2);
    expect(report.queriesRan).toBe(2 * 2 * 2);
  });

  it('catches a deliberate cross-tenant leak', async () => {
    const fuzz = new CrossTenantFuzz({
      tables: ['inbox_items'],
      workspaces: ['ws-A', 'ws-B'],
      variantsPerEndpoint: 1,
    });

    const report = await fuzz.run((_t, caller) => {
      const leaked: Row[] = caller === 'ws-A' ? [{ workspace_id: 'ws-B', id: 'leaked!' }] : [];
      return leaked;
    });

    expect(report.passed).toBe(false);
    expect(report.leaks.length).toBeGreaterThan(0);
    expect(report.leaks[0]?.callerWorkspaceId).toBe('ws-A');
  });

  it('requires at least two workspaces', () => {
    expect(
      () =>
        new CrossTenantFuzz({
          tables: ['t'],
          workspaces: ['only-one'],
        }),
    ).toThrow();
  });
});

describe('PII patterns', () => {
  it('matches common PII shapes', () => {
    expect(PII_PATTERNS.email.test('hello a@b.co world')).toBe(true);
    expect(PII_PATTERNS.ssn.test('id 123-45-6789')).toBe(true);
  });
});

describe('generatePiiPayloads', () => {
  it('returns a deterministic payload set per seed', () => {
    const a = generatePiiPayloads(1);
    const b = generatePiiPayloads(1);
    expect(a).toEqual(b);
    expect(a.map((p) => p.type)).toContain('email');
  });
});

describe('PiiRedactionFuzz', () => {
  it('flags pipelines that leak raw PII', async () => {
    const fuzz = new PiiRedactionFuzz({ variants: 2 });
    const report = await fuzz.run((s) => s);
    expect(report.passed).toBe(false);
    expect(report.leaks.length).toBeGreaterThan(0);
  });

  it('passes when pipeline redacts all known PII', async () => {
    const fuzz = new PiiRedactionFuzz({ variants: 2 });
    const report = await fuzz.run((input) => {
      let out = input;
      for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
        out = out.replace(pattern, `[REDACTED:${type}]`);
      }
      return out;
    });
    expect(report.passed).toBe(true);
    expect(report.variantsChecked).toBe(2);
  });
});

describe('AnonymizationFuzz', () => {
  it('passes when every group meets k', () => {
    const fuzz = new AnonymizationFuzz({
      quasiIdentifiers: ['zip', 'age'],
      k: 2,
    });
    const rows = [
      { zip: '10001', age: 30 },
      { zip: '10001', age: 30 },
      { zip: '10002', age: 40 },
      { zip: '10002', age: 40 },
    ];
    const report = fuzz.run(rows);
    expect(report.passed).toBe(true);
    expect(report.unsafeGroups).toHaveLength(0);
  });

  it('flags groups below k', () => {
    const fuzz = new AnonymizationFuzz({
      quasiIdentifiers: ['zip'],
      k: 3,
    });
    const rows = [{ zip: '1' }, { zip: '1' }, { zip: '2' }];
    const report = fuzz.run(rows);
    expect(report.passed).toBe(false);
    expect(report.unsafeGroups.length).toBeGreaterThan(0);
  });

  it('rejects invalid config', () => {
    expect(() => new AnonymizationFuzz({ quasiIdentifiers: [], k: 5 })).toThrow();
    expect(() => new AnonymizationFuzz({ quasiIdentifiers: ['x'], k: 0 })).toThrow();
  });
});
