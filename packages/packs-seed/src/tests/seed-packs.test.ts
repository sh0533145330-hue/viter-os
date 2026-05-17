import { describe, expect, it } from 'vitest';
import { definePack } from '@vita/pack-sdk';
import {
  allSeedPacks,
  assetMgmtPack,
  cpaPack,
  generalFoundationPack,
  propertyMgmtPack,
  revopsPack,
} from '../index.js';

describe('seed packs — structural validation', () => {
  it('exports five seed packs', () => {
    expect(allSeedPacks).toHaveLength(5);
  });

  it('every seed pack survives a re-validation through definePack', () => {
    for (const pack of allSeedPacks) {
      expect(() => definePack(pack)).not.toThrow();
    }
  });

  it('every pack has a unique key', () => {
    const keys = allSeedPacks.map((p) => p.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('every pack item has a unique key within its pack', () => {
    for (const pack of allSeedPacks) {
      const keys = pack.items.map((i) => i.key);
      const unique = new Set(keys);
      expect(unique.size).toBe(keys.length);
    }
  });
});

describe('general-foundation pack', () => {
  it('has the expected metadata', () => {
    expect(generalFoundationPack.key).toBe('general-foundation');
    expect(generalFoundationPack.vertical).toBe('general');
    expect(generalFoundationPack.vendor).toBe('VitaOS');
    expect(generalFoundationPack.license).toBe('MIT');
  });

  it('defines 5 ObjectTypes', () => {
    const objectTypes = generalFoundationPack.items.filter(
      (i) => i.kind === 'object_type',
    );
    expect(objectTypes).toHaveLength(5);
  });

  it('includes Person, Organization, Meeting, Document, Task', () => {
    const keys = generalFoundationPack.items.map((i) => i.key).sort();
    expect(keys).toEqual(
      ['document', 'meeting', 'organization', 'person', 'task'].sort(),
    );
  });

  it('has no dependencies', () => {
    expect(Object.keys(generalFoundationPack.dependencies)).toHaveLength(0);
  });
});

describe('cpa pack', () => {
  it('has the expected metadata', () => {
    expect(cpaPack.key).toBe('cpa');
    expect(cpaPack.vertical).toBe('cpa');
  });

  it('depends on general-foundation', () => {
    expect(cpaPack.dependencies['general-foundation']).toBe('^0.1.0');
  });

  it('includes core CPA ObjectTypes', () => {
    const keys = new Set(cpaPack.items.map((i) => i.key));
    for (const expected of [
      'client',
      'engagement',
      'tax_return',
      'transaction',
      'account',
      'invoice',
      'receipt',
    ]) {
      expect(keys.has(expected)).toBe(true);
    }
  });

  it('defines 7 ObjectTypes', () => {
    const objectTypes = cpaPack.items.filter((i) => i.kind === 'object_type');
    expect(objectTypes).toHaveLength(7);
  });
});

describe('property-mgmt pack', () => {
  it('has the expected metadata', () => {
    expect(propertyMgmtPack.key).toBe('property-mgmt');
    expect(propertyMgmtPack.vertical).toBe('property');
  });

  it('includes core property mgmt ObjectTypes', () => {
    const keys = new Set(propertyMgmtPack.items.map((i) => i.key));
    for (const expected of [
      'property',
      'unit',
      'tenant',
      'lease',
      'work_order',
      'vendor',
    ]) {
      expect(keys.has(expected)).toBe(true);
    }
  });

  it('defines 6 ObjectTypes', () => {
    const objectTypes = propertyMgmtPack.items.filter(
      (i) => i.kind === 'object_type',
    );
    expect(objectTypes).toHaveLength(6);
  });
});

describe('asset-mgmt pack', () => {
  it('has the expected metadata', () => {
    expect(assetMgmtPack.key).toBe('asset-mgmt');
    expect(assetMgmtPack.vertical).toBe('asset');
  });

  it('includes core asset mgmt ObjectTypes', () => {
    const keys = new Set(assetMgmtPack.items.map((i) => i.key));
    for (const expected of [
      'portfolio',
      'asset',
      'position',
      'trade',
      'mandate',
    ]) {
      expect(keys.has(expected)).toBe(true);
    }
  });

  it('defines 5 ObjectTypes', () => {
    const objectTypes = assetMgmtPack.items.filter(
      (i) => i.kind === 'object_type',
    );
    expect(objectTypes).toHaveLength(5);
  });
});

describe('revops pack', () => {
  it('has the expected metadata', () => {
    expect(revopsPack.key).toBe('revops');
    expect(revopsPack.vertical).toBe('revops');
  });

  it('includes core RevOps ObjectTypes', () => {
    const keys = new Set(revopsPack.items.map((i) => i.key));
    for (const expected of [
      'account',
      'contact',
      'lead',
      'opportunity',
      'pipeline',
    ]) {
      expect(keys.has(expected)).toBe(true);
    }
  });

  it('defines 5 ObjectTypes', () => {
    const objectTypes = revopsPack.items.filter((i) => i.kind === 'object_type');
    expect(objectTypes).toHaveLength(5);
  });
});
