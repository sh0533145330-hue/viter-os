import { PiiRedactor } from '@vita/anonymization';

export const SENSITIVE_KEYS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'ssn',
  'creditCard',
  'credit_card',
  'authorization',
  'cookie',
  'email',
  'phone',
  'session',
  'access_token',
  'refresh_token',
  'private_key',
  'privateKey',
  'client_secret',
  'clientSecret',
  'bearer',
] as const;

const SENSITIVE_KEY_SET = new Set<string>(SENSITIVE_KEYS.map((k) => k.toLowerCase()));

export const REDACTED_VALUE = '[REDACTED]';

const MAX_DEPTH = 8;
const MAX_STRING_LEN = 5000;
const TRUNC_SUFFIX = '…[TRUNCATED]';

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_SET.has(key.toLowerCase());
}

function truncate(value: string): string {
  if (value.length <= MAX_STRING_LEN) return value;
  return value.slice(0, MAX_STRING_LEN) + TRUNC_SUFFIX;
}

export function redactSensitiveKeys(obj: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveKeys(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        out[key] = REDACTED_VALUE;
      } else {
        out[key] = redactSensitiveKeys(value, depth + 1);
      }
    }
    return out;
  }

  if (typeof obj === 'string') return truncate(obj);

  return obj;
}

export interface LogRedactorOptions {
  strictness?: 'standard' | 'strict' | 'healthcare';
  extraSensitiveKeys?: string[];
  redactPiiInStrings?: boolean;
}

export function createLogRedactor(
  options: LogRedactorOptions = {},
): (obj: unknown) => unknown {
  const strictness = options.strictness ?? 'standard';
  const extraKeys = new Set(options.extraSensitiveKeys?.map((k) => k.toLowerCase()) ?? []);
  const redactInStrings = options.redactPiiInStrings ?? true;
  const piiRedactor = new PiiRedactor({ strictness });

  const keyMatches = (key: string): boolean => SENSITIVE_KEY_SET.has(key.toLowerCase()) || extraKeys.has(key.toLowerCase());

  const walk = (value: unknown, depth: number): unknown => {
    if (depth > MAX_DEPTH) return '[MAX_DEPTH]';
    if (value === null || value === undefined) return value;

    if (Array.isArray(value)) {
      return value.map((item) => walk(item, depth + 1));
    }

    if (value instanceof Date) return value.toISOString();
    if (value instanceof Error) {
      return {
        name: value.name,
        message: redactInStrings ? piiRedactor.redact(value.message).cleaned : value.message,
        stack: value.stack ? truncate(value.stack) : undefined,
      };
    }

    if (typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (keyMatches(k)) {
          out[k] = REDACTED_VALUE;
        } else {
          out[k] = walk(v, depth + 1);
        }
      }
      return out;
    }

    if (typeof value === 'string') {
      const truncated = truncate(value);
      if (!redactInStrings) return truncated;
      return piiRedactor.redact(truncated).cleaned;
    }

    return value;
  };

  return (obj: unknown): unknown => walk(obj, 0);
}
