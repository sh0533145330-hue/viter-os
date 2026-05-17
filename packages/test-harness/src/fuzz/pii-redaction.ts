export interface PiiPayload {
  readonly type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'mrn' | 'ip_address';
  readonly value: string;
}

/**
 * Built-in regex set used to scan pipeline outputs for PII leaks. These
 * mirror the patterns shipped by @vita/anonymization but are duplicated here
 * so the fuzz harness can operate without the schema dependency.
 */
export const PII_PATTERNS: Record<PiiPayload['type'], RegExp> = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone: /\+?\d[\d\s().-]{7,}\d/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  credit_card: /\b(?:\d[ -]?){13,16}\b/g,
  mrn: /\bMRN[:\s-]?\d{6,}\b/gi,
  ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

/**
 * Deterministic payload generator. Yields canonical PII strings per category.
 */
export function generatePiiPayloads(seed = 1): readonly PiiPayload[] {
  const k = Math.max(1, seed);
  return [
    { type: 'email', value: `user.${k}@example.com` },
    { type: 'phone', value: `+1-555-010-${(1000 + k).toString().padStart(4, '0')}` },
    { type: 'ssn', value: `123-${(45 + (k % 50)).toString().padStart(2, '0')}-6789` },
    {
      type: 'credit_card',
      value: `4111 1111 1111 ${(1111 + k).toString().padStart(4, '0')}`,
    },
    { type: 'mrn', value: `MRN-${(1000000 + k).toString()}` },
    { type: 'ip_address', value: `10.0.0.${k % 250}` },
  ];
}

export interface PiiLeak {
  readonly payloadType: PiiPayload['type'];
  readonly leakedValue: string;
  readonly output: string;
}

export interface PiiFuzzReport {
  readonly leaks: readonly PiiLeak[];
  readonly variantsChecked: number;
  readonly passed: boolean;
}

export type PipelineFn = (input: string) => Promise<string> | string;

export interface PiiFuzzOptions {
  readonly variants?: number;
  readonly customPayloads?: readonly PiiPayload[];
}

/**
 * Pipeline output PII fuzz: pushes PII-laden text through a pipeline function
 * and asserts none of the original PII strings appear in the output, AND that
 * generic PII patterns do not appear either.
 */
export class PiiRedactionFuzz {
  private readonly variants: number;
  private readonly customPayloads?: readonly PiiPayload[];

  constructor(options: PiiFuzzOptions = {}) {
    this.variants = options.variants ?? 16;
    if (options.customPayloads !== undefined) {
      this.customPayloads = options.customPayloads;
    }
  }

  async run(pipeline: PipelineFn): Promise<PiiFuzzReport> {
    const leaks: PiiLeak[] = [];
    let checked = 0;
    for (let v = 1; v <= this.variants; v++) {
      const payloads = this.customPayloads ?? generatePiiPayloads(v);
      const input = `User says: ${payloads.map((p) => p.value).join(' / ')}`;
      const output = await pipeline(input);
      checked++;
      for (const p of payloads) {
        if (output.includes(p.value)) {
          leaks.push({ payloadType: p.type, leakedValue: p.value, output });
        }
        const pattern = PII_PATTERNS[p.type];
        pattern.lastIndex = 0;
        const m = pattern.exec(output);
        if (m?.[0] && !output.includes(`[REDACTED:${p.type}]`)) {
          leaks.push({ payloadType: p.type, leakedValue: m[0], output });
        }
      }
    }
    return { leaks, variantsChecked: checked, passed: leaks.length === 0 };
  }
}
