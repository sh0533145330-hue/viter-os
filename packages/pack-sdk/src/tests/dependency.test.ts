import { describe, expect, it } from 'vitest';
import {
  resolveDependencies,
  checkCompatibility,
} from '../dependency.js';
import type { PackManifest } from '../types.js';

function makePack(
  overrides: Partial<PackManifest> & { key: string },
): PackManifest {
  return {
    key: overrides.key,
    name: overrides.name ?? 'Test Pack',
    description: overrides.description ?? 'Test',
    vertical: overrides.vertical ?? 'test',
    vendor: overrides.vendor ?? 'VitaOS',
    license: overrides.license ?? 'MIT',
    items: overrides.items ?? [],
    version: overrides.version,
    dependencies: overrides.dependencies ?? {},
  };
}

describe('resolveDependencies', () => {
  it('resolves simple dependency', async () => {
    const packs = [
      makePack({
        key: 'my-pack',
        version: '1.0.0',
        dependencies: { 'base-pack': '^1.0.0' },
      }),
    ];

    const available = new Map<string, string[]>([
      ['base-pack', ['1.0.0', '1.2.0', '2.0.0']],
    ]);

    const result = await resolveDependencies(packs, available);

    expect(result.conflicts).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
    expect(result.resolved['base-pack']).toBe('1.2.0');
  });

  it('detects missing dependency', async () => {
    const packs = [
      makePack({
        key: 'my-pack',
        version: '1.0.0',
        dependencies: { 'unknown-pack': '^1.0.0' },
      }),
    ];

    const available = new Map<string, string[]>([]);

    const result = await resolveDependencies(packs, available);

    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing[0]).toContain('unknown-pack');
  });

  it('detects when no version satisfies range', async () => {
    const packs = [
      makePack({
        key: 'my-pack',
        version: '1.0.0',
        dependencies: { 'base-pack': '^3.0.0' },
      }),
    ];

    const available = new Map<string, string[]>([
      ['base-pack', ['1.0.0', '1.5.0']],
    ]);

    const result = await resolveDependencies(packs, available);

    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing[0]).toContain('^3.0.0');
  });

  it('detects conflicts between packs', async () => {
    const packs = [
      makePack({
        key: 'pack-a',
        version: '1.0.0',
        dependencies: { 'shared-lib': '^1.0.0' },
      }),
      makePack({
        key: 'pack-b',
        version: '1.0.0',
        dependencies: { 'shared-lib': '^2.0.0' },
      }),
    ];

    const available = new Map<string, string[]>([
      ['shared-lib', ['1.0.0', '1.5.0', '2.0.0']],
    ]);

    const result = await resolveDependencies(packs, available);

    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it('resolves caret range correctly', async () => {
    const packs = [
      makePack({
        key: 'my-pack',
        version: '1.0.0',
        dependencies: { 'dep': '^1.2.3' },
      }),
    ];

    const available = new Map<string, string[]>([['dep', ['1.2.3', '1.9.0', '2.0.0']]]);

    const result = await resolveDependencies(packs, available);
    expect(result.resolved['dep']).toBe('1.9.0');
  });
});

describe('checkCompatibility', () => {
  it('returns empty for compatible deps', async () => {
    const pack = makePack({
      key: 'my-pack',
      dependencies: { 'dep': '^1.0.0' },
    });

    const resolved = new Map<string, string>([['dep', '1.5.0']]);
    const issues = await checkCompatibility(pack, resolved);
    expect(issues).toHaveLength(0);
  });

  it('returns issues for incompatible version', async () => {
    const pack = makePack({
      key: 'my-pack',
      dependencies: { 'dep': '^1.0.0' },
    });

    const resolved = new Map<string, string>([['dep', '2.0.0']]);
    const issues = await checkCompatibility(pack, resolved);
    expect(issues.length).toBeGreaterThan(0);
  });

  it('returns issue for missing resolved dep', async () => {
    const pack = makePack({
      key: 'my-pack',
      dependencies: { 'dep': '^1.0.0' },
    });

    const resolved = new Map<string, string>([]);
    const issues = await checkCompatibility(pack, resolved);
    expect(issues.length).toBeGreaterThan(0);
  });
});
