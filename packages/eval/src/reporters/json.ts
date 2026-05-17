import { writeFile } from 'node:fs/promises';
import type { EvalResult, Reporter } from '../types.js';

export interface JsonReporterOptions {
  readonly outputPath?: string;
  readonly pretty?: boolean;
  readonly sink?: (json: string) => Promise<void> | void;
}

export class JsonReporter implements Reporter {
  private readonly outputPath?: string;
  private readonly pretty: boolean;
  private readonly sink?: (json: string) => Promise<void> | void;
  private lastJson = '';

  constructor(options: JsonReporterOptions = {}) {
    if (options.outputPath !== undefined) this.outputPath = options.outputPath;
    this.pretty = options.pretty ?? true;
    if (options.sink !== undefined) this.sink = options.sink;
  }

  async report(result: EvalResult): Promise<void> {
    const json = JSON.stringify(result, null, this.pretty ? 2 : 0);
    this.lastJson = json;
    if (this.sink) await this.sink(json);
    if (this.outputPath) await writeFile(this.outputPath, json, 'utf8');
  }

  serialize(result: EvalResult): string {
    return JSON.stringify(result, null, this.pretty ? 2 : 0);
  }

  getLast(): string {
    return this.lastJson;
  }
}
