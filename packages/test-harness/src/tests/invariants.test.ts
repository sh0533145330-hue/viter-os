import { describe, expect, it } from 'vitest';
import {
  type AuditLogEntry,
  type DerivationMetadata,
  type LineageDataset,
  type StateChange,
  checkAuditCompleteness,
  checkLineageCompleteness,
  checkMigration,
  checkMigrations,
} from '../invariants/index.js';
import { readK6Template } from '../load/index.js';

function derivation(overrides: Partial<DerivationMetadata> = {}): DerivationMetadata {
  return {
    model: 'gpt-test',
    promptVersion: 'p-1',
    configHash: 'cfg-1',
    timestamp: new Date(0).toISOString(),
    ...overrides,
  };
}

describe('checkLineageCompleteness', () => {
  it('passes for a fully linked dataset', () => {
    const dataset: LineageDataset = {
      rows: [
        { id: 'l0_a', layer: 'L0', parentIds: [] },
        { id: 'l1_a', layer: 'L1', parentIds: ['l0_a'] },
        { id: 'l2_a', layer: 'L2', parentIds: ['l1_a'] },
      ],
      derivations: new Map([
        ['l1_a', derivation()],
        ['l2_a', derivation()],
      ]),
    };
    const report = checkLineageCompleteness(dataset);
    expect(report.passed).toBe(true);
    expect(report.orphans).toHaveLength(0);
    expect(report.perLayer.L0).toBe(1);
    expect(report.perLayer.L2).toBe(1);
  });

  it('flags L1 row missing parent', () => {
    const dataset: LineageDataset = {
      rows: [{ id: 'l1_a', layer: 'L1', parentIds: [] }],
      derivations: new Map([['l1_a', derivation()]]),
    };
    const report = checkLineageCompleteness(dataset);
    expect(report.passed).toBe(false);
    expect(report.orphans[0]?.reason).toBe('missing-parent');
  });

  it('flags rows pointing at non-existent parents', () => {
    const dataset: LineageDataset = {
      rows: [{ id: 'l1_a', layer: 'L1', parentIds: ['l0_missing'] }],
      derivations: new Map([['l1_a', derivation()]]),
    };
    const report = checkLineageCompleteness(dataset);
    expect(report.passed).toBe(false);
    expect(report.orphans[0]?.reason).toBe('parent-not-found');
  });

  it('flags rows missing reprocessability metadata', () => {
    const dataset: LineageDataset = {
      rows: [
        { id: 'l0_a', layer: 'L0', parentIds: [] },
        { id: 'l1_a', layer: 'L1', parentIds: ['l0_a'] },
      ],
      derivations: new Map([['l1_a', derivation({ promptVersion: null })]]),
    };
    const report = checkLineageCompleteness(dataset);
    expect(report.passed).toBe(false);
    expect(report.orphans[0]?.reason).toBe('incomplete-derivation');
  });
});

describe('checkMigration', () => {
  it('accepts a well-formed migration', () => {
    const violations = checkMigration({
      name: '20260101_create_widgets.sql',
      up: `CREATE TABLE widgets (
        id uuid primary key,
        workspace_id uuid not null
      );
      CREATE POLICY widgets_isolation ON widgets USING (workspace_id = current_setting('app.ws')::uuid);`,
      down: 'DROP TABLE widgets;',
    });
    expect(violations).toHaveLength(0);
  });

  it('rejects bad naming', () => {
    const violations = checkMigration({
      name: 'bad-name.sql',
      up: 'SELECT 1;',
      down: 'SELECT 1;',
    });
    expect(violations.some((v) => v.rule === 'naming')).toBe(true);
  });

  it('rejects empty down', () => {
    const violations = checkMigration({
      name: '20260101_noop.sql',
      up: 'SELECT 1;',
      down: '',
    });
    expect(violations.some((v) => v.rule === 'empty-down')).toBe(true);
  });

  it('rejects DROP COLUMN without SET UNUSED', () => {
    const violations = checkMigration({
      name: '20260101_drop_col.sql',
      up: 'ALTER TABLE widgets DROP COLUMN legacy_field;',
      down: 'ALTER TABLE widgets ADD COLUMN legacy_field text;',
    });
    expect(violations.some((v) => v.rule === 'drop-column-grace')).toBe(true);
  });

  it('rejects ALTER COLUMN TYPE rewrites', () => {
    const violations = checkMigration({
      name: '20260101_alter_type.sql',
      up: 'ALTER TABLE widgets ALTER COLUMN amount TYPE numeric(10,2);',
      down: 'ALTER TABLE widgets ALTER COLUMN amount TYPE integer;',
    });
    expect(violations.some((v) => v.rule === 'alter-column-type')).toBe(true);
  });

  it('requires workspace_id and RLS policy on new tables', () => {
    const violations = checkMigration({
      name: '20260101_create_unsafe.sql',
      up: 'CREATE TABLE unsafe (id uuid primary key);',
      down: 'DROP TABLE unsafe;',
    });
    const rules = violations.map((v) => v.rule);
    expect(rules).toContain('workspace-id-required');
    expect(rules).toContain('rls-policy-required');
    // drop-table-grace also triggered because down contains DROP TABLE without rename;
    // but that's in the down statement and we only scan up — confirm it's NOT flagged.
    expect(rules).not.toContain('drop-table-grace');
  });
});

describe('checkMigrations aggregate', () => {
  it('aggregates per-file violations', () => {
    const report = checkMigrations([
      { name: 'broken.sql', up: '', down: '' },
      { name: '20260101_ok.sql', up: 'SELECT 1;', down: 'SELECT 1;' },
    ]);
    expect(report.passed).toBe(false);
    expect(report.migrationsChecked).toBe(2);
    expect(report.violations.length).toBeGreaterThan(0);
  });
});

describe('checkAuditCompleteness', () => {
  const sc: StateChange = {
    id: 'sc-1',
    table: 'agent_runs',
    action: 'insert',
    workspaceId: 'ws-A',
    actorId: 'user-1',
    occurredAt: new Date(0).toISOString(),
  };

  it('passes when every state change has a matching audit entry', () => {
    const audit: AuditLogEntry[] = [
      {
        id: 'a-1',
        subjectId: 'sc-1',
        table: 'agent_runs',
        action: 'insert',
        workspaceId: 'ws-A',
        actorId: 'user-1',
        occurredAt: new Date(0).toISOString(),
      },
    ];
    const report = checkAuditCompleteness([sc], audit);
    expect(report.passed).toBe(true);
    expect(report.stateChangesChecked).toBe(1);
  });

  it('flags missing audit entries', () => {
    const report = checkAuditCompleteness([sc], []);
    expect(report.passed).toBe(false);
    expect(report.missing[0]?.reason).toBe('missing-audit');
  });

  it('flags workspace mismatch on audit entries', () => {
    const audit: AuditLogEntry[] = [
      {
        id: 'a-1',
        subjectId: 'sc-1',
        table: 'agent_runs',
        action: 'insert',
        workspaceId: 'ws-WRONG',
        actorId: null,
        occurredAt: new Date(0).toISOString(),
      },
    ];
    const report = checkAuditCompleteness([sc], audit);
    expect(report.passed).toBe(false);
    expect(report.missing[0]?.reason).toBe('workspace-mismatch');
  });
});

describe('load/k6 template', () => {
  it('exposes a runnable k6 template', async () => {
    const tpl = await readK6Template();
    expect(tpl).toContain('export const options');
    expect(tpl).toContain('thresholds');
    expect(tpl).toContain('extraction');
    expect(tpl).toContain('query');
  });
});
