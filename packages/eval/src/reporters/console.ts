import type { EvalResult, Reporter } from '../types.js';

export interface ConsoleReporterOptions {
  readonly verbose?: boolean;
  readonly logger?: Pick<Console, 'log' | 'error'>;
}

export class ConsoleReporter implements Reporter {
  private readonly verbose: boolean;
  private readonly logger: Pick<Console, 'log' | 'error'>;

  constructor(options: ConsoleReporterOptions = {}) {
    this.verbose = options.verbose ?? false;
    this.logger = options.logger ?? console;
  }

  report(result: EvalResult): void {
    const status = result.passed ? 'PASS' : 'FAIL';
    const pct = (result.score * 100).toFixed(2);
    this.logger.log(
      `[eval ${status}] ${result.suiteKey} score=${pct}% passed=${result.passedCases}/${result.totalCases} threshold=${result.threshold} duration=${result.durationMs.toFixed(1)}ms`,
    );
    if (this.verbose || !result.passed) {
      for (const c of result.cases) {
        const cStatus = c.passed ? 'ok  ' : 'fail';
        const errSuffix = c.error ? ` error=${c.error}` : '';
        this.logger.log(
          `  ${cStatus} ${c.caseId} score=${(c.score * 100).toFixed(1)}% duration=${c.durationMs.toFixed(1)}ms${errSuffix}`,
        );
        for (const a of c.assertions) {
          if (!a.passed) {
            this.logger.log(`      - ${a.message ?? 'assertion failed'}`);
          }
        }
      }
    }
  }
}
