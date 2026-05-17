import { writeFile } from 'node:fs/promises';
import type { EvalResult, Reporter } from '../types.js';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface JunitReporterOptions {
  readonly outputPath?: string;
  readonly sink?: (xml: string) => Promise<void> | void;
}

export class JunitReporter implements Reporter {
  private readonly outputPath?: string;
  private readonly sink?: (xml: string) => Promise<void> | void;
  private lastXml = '';

  constructor(options: JunitReporterOptions = {}) {
    if (options.outputPath !== undefined) this.outputPath = options.outputPath;
    if (options.sink !== undefined) this.sink = options.sink;
  }

  async report(result: EvalResult): Promise<void> {
    const xml = this.serialize(result);
    this.lastXml = xml;
    if (this.sink) await this.sink(xml);
    if (this.outputPath) await writeFile(this.outputPath, xml, 'utf8');
  }

  serialize(result: EvalResult): string {
    const failures = result.totalCases - result.passedCases;
    const seconds = (result.durationMs / 1000).toFixed(3);
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(
      `<testsuite name="${escapeXml(result.suiteKey)}" tests="${result.totalCases}" failures="${failures}" time="${seconds}">`,
    );
    for (const c of result.cases) {
      const caseSeconds = (c.durationMs / 1000).toFixed(3);
      lines.push(
        `  <testcase classname="${escapeXml(result.suiteKey)}" name="${escapeXml(c.caseId)}" time="${caseSeconds}">`,
      );
      if (!c.passed) {
        const message =
          c.error ??
          c.assertions
            .filter((a) => !a.passed)
            .map((a) => a.message ?? 'assertion failed')
            .join('; ') ??
          `score ${c.score} below threshold`;
        lines.push(
          `    <failure message="${escapeXml(message)}">${escapeXml(`score=${c.score}`)}</failure>`,
        );
      }
      lines.push('  </testcase>');
    }
    lines.push('</testsuite>');
    return lines.join('\n');
  }

  getLast(): string {
    return this.lastXml;
  }
}
