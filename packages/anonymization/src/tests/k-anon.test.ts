import { describe, expect, it } from 'vitest';
import { KAnonymityChecker } from '../k-anonymity.js';

describe('KAnonymityChecker', () => {
  it('passes when all groups meet threshold', () => {
    const checker = new KAnonymityChecker({
      k: 3,
      quasiIdentifiers: ['age', 'zip'],
    });

    const rows = [
      { age: 25, zip: '90210' },
      { age: 25, zip: '90210' },
      { age: 25, zip: '90210' },
      { age: 30, zip: '10001' },
      { age: 30, zip: '10001' },
      { age: 30, zip: '10001' },
    ];

    const report = checker.check(rows);
    expect(report.passes).toBe(true);
    expect(report.failingGroups).toHaveLength(0);
    expect(report.totalRows).toBe(6);
  });

  it('fails when any group is below threshold', () => {
    const checker = new KAnonymityChecker({
      k: 5,
      quasiIdentifiers: ['city'],
    });

    const rows = [
      { city: 'NYC' },
      { city: 'NYC' },
      { city: 'NYC' },
      { city: 'LA' },
      { city: 'LA' },
    ];

    const report = checker.check(rows);
    expect(report.passes).toBe(false);
    expect(report.failingGroups).toHaveLength(2);
  });

  it('returns proper group counts', () => {
    const checker = new KAnonymityChecker({
      k: 2,
      quasiIdentifiers: ['dept'],
    });

    const rows = [
      { dept: 'eng' },
      { dept: 'eng' },
      { dept: 'eng' },
      { dept: 'sales' },
    ];

    const report = checker.check(rows);
    expect(report.groupCount).toBe(2);

    const engGroup = report.failingGroups.find(
      (g) => g.groupKey.dept === 'eng',
    );
    // eng has 3 >= 2, should pass
    expect(engGroup).toBeUndefined();

    const salesGroup = report.failingGroups.find(
      (g) => g.groupKey.dept === 'sales',
    );
    expect(salesGroup).toBeDefined();
    expect(salesGroup!.count).toBe(1);
    expect(salesGroup!.passes).toBe(false);
  });

  it('fails on empty dataset', () => {
    const checker = new KAnonymityChecker({
      k: 5,
      quasiIdentifiers: ['x'],
    });
    const report = checker.check([]);
    expect(report.passes).toBe(false);
    expect(report.totalRows).toBe(0);
  });

  it('defaults to k=25 when no domain specified', () => {
    const checker = new KAnonymityChecker({
      quasiIdentifiers: ['foo'],
    });
    expect(checker.getThreshold()).toBe(25);
  });

  it('defaults to k=100 for healthcare domain', () => {
    const checker = new KAnonymityChecker({
      quasiIdentifiers: ['foo'],
      domain: 'healthcare',
    });
    expect(checker.getThreshold()).toBe(100);
  });

  it('overrides domain default when k is explicit', () => {
    const checker = new KAnonymityChecker({
      k: 10,
      quasiIdentifiers: ['foo'],
      domain: 'healthcare',
    });
    expect(checker.getThreshold()).toBe(10);
  });

  it('handles multiple quasi-identifiers', () => {
    const checker = new KAnonymityChecker({
      k: 2,
      quasiIdentifiers: ['age', 'gender', 'zip'],
    });

    const rows = [
      { age: 30, gender: 'M', zip: '10001' },
      { age: 30, gender: 'M', zip: '10001' },
      { age: 25, gender: 'F', zip: '20002' },
      { age: 25, gender: 'F', zip: '20002' },
      { age: 30, gender: 'F', zip: '10001' },
    ];

    const report = checker.check(rows);
    // Last group: (30, F, 10001) has 1 row < 2
    expect(report.passes).toBe(false);
    expect(report.failingGroups).toHaveLength(1);
  });

  it('handles null/undefined quasi-identifier values', () => {
    const checker = new KAnonymityChecker({
      k: 2,
      quasiIdentifiers: ['dept'],
    });

    const rows: Record<string, unknown>[] = [
      { dept: null },
      { dept: null },
      { dept: 'sales' },
    ];

    const report = checker.check(rows);
    // null group has 2 >= 2, sales has 1 < 2
    expect(report.passes).toBe(false);
    expect(report.failingGroups).toHaveLength(1);
    expect(report.failingGroups[0]!.groupKey.dept).toBe('sales');
  });

  it('getQuasiIdentifiers returns correct columns', () => {
    const checker = new KAnonymityChecker({
      k: 3,
      quasiIdentifiers: ['colA', 'colB'],
    });
    expect(checker.getQuasiIdentifiers()).toEqual(['colA', 'colB']);
  });
});
