import type { AssertionResult } from './types.js';

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (Array.isArray(b)) return false;

  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const aKeys = Object.keys(ao);
  const bKeys = Object.keys(bo);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bo, key)) return false;
    if (!deepEqual(ao[key], bo[key])) return false;
  }
  return true;
}

export { deepEqual };

function pass(): AssertionResult {
  return { passed: true };
}

function fail(message: string): AssertionResult {
  return { passed: false, message };
}

function fmt(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const assertions = {
  equals<T>(expected: T): (actual: T) => AssertionResult {
    return (actual) =>
      deepEqual(actual, expected) ? pass() : fail(`Expected ${fmt(expected)}, got ${fmt(actual)}`);
  },

  notEquals<T>(expected: T): (actual: T) => AssertionResult {
    return (actual) =>
      deepEqual(actual, expected) ? fail(`Expected value not equal to ${fmt(expected)}`) : pass();
  },

  contains(substring: string): (actual: string) => AssertionResult {
    return (actual) =>
      typeof actual === 'string' && actual.includes(substring)
        ? pass()
        : fail(`Expected string to contain ${fmt(substring)}, got ${fmt(actual)}`);
  },

  matches(pattern: RegExp): (actual: string) => AssertionResult {
    return (actual) => {
      if (typeof actual !== 'string') {
        return fail(`Expected string for regex match, got ${typeof actual}`);
      }
      return pattern.test(actual)
        ? pass()
        : fail(`Expected ${fmt(actual)} to match ${pattern.toString()}`);
    };
  },

  scoreAtLeast(threshold: number): (actual: number) => AssertionResult {
    return (actual) =>
      typeof actual === 'number' && actual >= threshold
        ? pass()
        : fail(`Expected score >= ${threshold}, got ${actual}`);
  },

  scoreAtMost(threshold: number): (actual: number) => AssertionResult {
    return (actual) =>
      typeof actual === 'number' && actual <= threshold
        ? pass()
        : fail(`Expected score <= ${threshold}, got ${actual}`);
  },

  noLeak(forbiddenStrings: readonly string[]): (actual: string) => AssertionResult {
    return (actual) => {
      if (typeof actual !== 'string') {
        return fail(`Expected string for noLeak check, got ${typeof actual}`);
      }
      for (const forbidden of forbiddenStrings) {
        if (actual.includes(forbidden)) {
          return fail(`Leaked forbidden string: ${fmt(forbidden)}`);
        }
      }
      return pass();
    };
  },

  hasKey(key: string): (actual: Record<string, unknown>) => AssertionResult {
    return (actual) => {
      if (actual === null || typeof actual !== 'object') {
        return fail(`Expected object for hasKey, got ${typeof actual}`);
      }
      return key in actual ? pass() : fail(`Expected object to have key ${fmt(key)}`);
    };
  },

  isTrue(): (actual: boolean) => AssertionResult {
    return (actual) => (actual === true ? pass() : fail(`Expected true, got ${fmt(actual)}`));
  },

  isFalse(): (actual: boolean) => AssertionResult {
    return (actual) => (actual === false ? pass() : fail(`Expected false, got ${fmt(actual)}`));
  },

  every<T>(predicate: (item: T) => boolean): (actual: readonly T[]) => AssertionResult {
    return (actual) => {
      if (!Array.isArray(actual)) {
        return fail(`Expected array for every, got ${typeof actual}`);
      }
      for (let i = 0; i < actual.length; i++) {
        const item = actual[i] as T;
        if (!predicate(item)) {
          return fail(`Predicate failed at index ${i}`);
        }
      }
      return pass();
    };
  },
} as const;
