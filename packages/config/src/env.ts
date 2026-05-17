import { config as loadDotenv } from 'dotenv';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { z, ZodError } from 'zod';

let loaded = false;

function ensureDotenvLoaded(): void {
  if (loaded) return;
  loaded = true;
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  loadDotenv({ path: `.env.${nodeEnv}.local`, override: false });
  loadDotenv({ path: '.env.local', override: false });
  loadDotenv({ path: `.env.${nodeEnv}`, override: false });
  loadDotenv({ path: '.env', override: false });
}

export class EnvValidationError extends Error {
  readonly issues: readonly { path: string; message: string }[];
  constructor(issues: readonly { path: string; message: string }[]) {
    super(
      `Environment validation failed:\n${issues
        .map((i) => `  - ${i.path}: ${i.message}`)
        .join('\n')}`,
    );
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

export function loadEnv<TSchema extends ZodTypeAny>(schema: TSchema): ZodInfer<TSchema> {
  ensureDotenvLoaded();
  try {
    return schema.parse(process.env) as ZodInfer<TSchema>;
  } catch (err) {
    if (err instanceof ZodError) {
      throw new EnvValidationError(
        err.issues.map((i) => ({ path: i.path.join('.') || '<root>', message: i.message })),
      );
    }
    throw err;
  }
}

export const boolFromEnv = z
  .union([z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .transform((v) => v === 'true' || v === '1');

export const intFromEnv = z
  .string()
  .regex(/^-?\d+$/u, 'expected integer')
  .transform((v) => Number.parseInt(v, 10));

export { z };
