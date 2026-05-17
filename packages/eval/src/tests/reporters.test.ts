import { describe, expect, it } from 'vitest';
import { ConsoleReporter } from '../reporters/console.js';
import { JsonReporter } from '../reporters/json.js';
import { JunitReporter } from '../reporters/junit.js';
import type { EvalResult } from '../types.js';

function mkResult(): EvalResult {
  return {
    suiteKey: 'demo.suite',
    passed: false,
    totalCases: 2,
    passedCases: 1,
    score: 0.75,
    threshold: 0.85,
    durationMs: 12.5,
    cases: [
      {
        caseId: 'ok-case',
        passed: true,
        actual: 'hello',
        expected: 'hello',
        assertions: [{ passed: true }],
        score: 1,
        durationMs: 1,
      },
      {
        caseId: 'bad-case <special>',
        passed: false,
        actual: 'oops',
        expected: 'hello',
        assertions: [{ passed: false, message: 'mismatch' }],
        score: 0.5,
        durationMs: 11.5,
        error: 'boom & <fail>',
      },
    ],
  };
}

describe('ConsoleReporter', () => {
  it('writes a summary line via injected logger', () => {
    const lines: string[] = [];
    const reporter = new ConsoleReporter({
      logger: {
        log: (msg: unknown) => lines.push(String(msg)),
        error: (msg: unknown) => lines.push(String(msg)),
      },
    });
    reporter.report(mkResult());
    expect(lines[0]).toContain('demo.suite');
    expect(lines[0]).toContain('FAIL');
    expect(lines.some((l) => l.includes('bad-case'))).toBe(true);
  });
});

describe('JsonReporter', () => {
  it('serializes results to JSON', () => {
    const reporter = new JsonReporter({ pretty: false });
    const json = reporter.serialize(mkResult());
    const parsed = JSON.parse(json) as EvalResult;
    expect(parsed.suiteKey).toBe('demo.suite');
    expect(parsed.cases).toHaveLength(2);
  });

  it('invokes sink on report', async () => {
    let captured = '';
    const reporter = new JsonReporter({
      sink: (json) => {
        captured = json;
      },
    });
    await reporter.report(mkResult());
    expect(captured).toContain('demo.suite');
    expect(reporter.getLast()).toBe(captured);
  });
});

describe('JunitReporter', () => {
  it('emits valid junit XML structure', () => {
    const reporter = new JunitReporter();
    const xml = reporter.serialize(mkResult());
    expect(xml).toContain('<?xml');
    expect(xml).toContain('<testsuite');
    expect(xml).toContain('tests="2"');
    expect(xml).toContain('failures="1"');
  });

  it('escapes XML special characters', () => {
    const reporter = new JunitReporter();
    const xml = reporter.serialize(mkResult());
    expect(xml).toContain('bad-case &lt;special&gt;');
    expect(xml).toContain('boom &amp; &lt;fail&gt;');
  });

  it('invokes sink on report', async () => {
    let captured = '';
    const reporter = new JunitReporter({
      sink: (xml) => {
        captured = xml;
      },
    });
    await reporter.report(mkResult());
    expect(captured).toContain('<testsuite');
  });
});
