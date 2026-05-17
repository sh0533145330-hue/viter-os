import { describe, expect, it } from 'vitest';
import { assertions, deepEqual } from '../assertions.js';

describe('deepEqual', () => {
  it('compares primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it('compares nested objects', () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('compares arrays', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
  });
});

describe('assertions.equals', () => {
  it('passes when values match', () => {
    const a = assertions.equals('hello');
    expect(a('hello').passed).toBe(true);
  });

  it('fails with diagnostic message when values differ', () => {
    const a = assertions.equals({ x: 1 });
    const r = a({ x: 2 });
    expect(r.passed).toBe(false);
    expect(r.message).toContain('Expected');
  });
});

describe('assertions.contains', () => {
  it('passes when substring is present', () => {
    expect(assertions.contains('foo')('foobar').passed).toBe(true);
  });
  it('fails when substring missing', () => {
    const r = assertions.contains('baz')('foobar');
    expect(r.passed).toBe(false);
    expect(r.message).toContain('baz');
  });
});

describe('assertions.matches', () => {
  it('passes when regex matches', () => {
    expect(assertions.matches(/^foo/)('foobar').passed).toBe(true);
  });
  it('fails when regex does not match', () => {
    expect(assertions.matches(/^baz/)('foobar').passed).toBe(false);
  });
  it('fails when actual is not a string', () => {
    expect(assertions.matches(/x/)(42 as unknown as string).passed).toBe(false);
  });
});

describe('assertions.scoreAtLeast / scoreAtMost', () => {
  it('scoreAtLeast passes when actual >= threshold', () => {
    expect(assertions.scoreAtLeast(0.5)(0.6).passed).toBe(true);
    expect(assertions.scoreAtLeast(0.5)(0.4).passed).toBe(false);
  });
  it('scoreAtMost passes when actual <= threshold', () => {
    expect(assertions.scoreAtMost(0.5)(0.4).passed).toBe(true);
    expect(assertions.scoreAtMost(0.5)(0.6).passed).toBe(false);
  });
});

describe('assertions.noLeak', () => {
  it('passes when none of the forbidden strings appear', () => {
    const r = assertions.noLeak(['ssn', 'mrn'])('safe text');
    expect(r.passed).toBe(true);
  });
  it('fails when a forbidden substring appears', () => {
    const r = assertions.noLeak(['secret'])('this is a secret');
    expect(r.passed).toBe(false);
    expect(r.message).toContain('secret');
  });
});

describe('assertions.hasKey', () => {
  it('passes when key present', () => {
    expect(assertions.hasKey('a')({ a: 1 }).passed).toBe(true);
  });
  it('fails when key missing', () => {
    expect(assertions.hasKey('b')({ a: 1 }).passed).toBe(false);
  });
});

describe('assertions.isTrue / isFalse', () => {
  it('isTrue passes only for literal true', () => {
    expect(assertions.isTrue()(true).passed).toBe(true);
    expect(assertions.isTrue()(false).passed).toBe(false);
  });
  it('isFalse passes only for literal false', () => {
    expect(assertions.isFalse()(false).passed).toBe(true);
    expect(assertions.isFalse()(true).passed).toBe(false);
  });
});

describe('assertions.every', () => {
  it('passes when predicate holds for every item', () => {
    expect(assertions.every<number>((n) => n > 0)([1, 2, 3]).passed).toBe(true);
  });
  it('fails on first violation', () => {
    const r = assertions.every<number>((n) => n > 0)([1, -1, 2]);
    expect(r.passed).toBe(false);
    expect(r.message).toContain('index 1');
  });
});
