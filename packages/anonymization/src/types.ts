import { z } from 'zod';

// ── PII detection ──────────────────────────────────────────────

export const piiTypeSchema = z.enum([
  'name',
  'email',
  'phone',
  'ssn',
  'credit_card',
  'address',
  'ip_address',
  'date_of_birth',
  'medical_record',
  'health_plan',
  'account_number',
  'license_plate',
  'device_id',
  'url',
  'biometric',
  'fax',
  'photograph',
]);
export type PiiType = z.infer<typeof piiTypeSchema>;

export const strictnessLevelSchema = z.enum(['standard', 'strict', 'healthcare']);
export type StrictnessLevel = z.infer<typeof strictnessLevelSchema>;

export const piiMatchSchema = z.object({
  type: piiTypeSchema,
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  text: z.string(),
  replacement: z.string(),
});
export type PiiMatch = z.infer<typeof piiMatchSchema>;

// ── Redaction output ───────────────────────────────────────────

export const redactionResultSchema = z.object({
  cleaned: z.string(),
  matches: z.array(piiMatchSchema),
});
export type RedactionResult = z.infer<typeof redactionResultSchema>;

export const taggedRedactionResultSchema = z.object({
  cleaned: z.string(),
  piiTags: z.array(z.string()),
});
export type TaggedRedactionResult = z.infer<typeof taggedRedactionResultSchema>;

// ── Redactor config ────────────────────────────────────────────

export const redactorConfigSchema = z.object({
  strictness: strictnessLevelSchema.default('standard'),
  /** Locale codes to enable locale-specific patterns */
  locales: z.array(z.string()).default([]),
  /** Custom regex patterns to add */
  extraPatterns: z
    .array(
      z.object({
        type: piiTypeSchema,
        pattern: z.string(),
        replacement: z.string().optional(),
      }),
    )
    .default([]),
  /** Types to skip */
  excludeTypes: z.array(piiTypeSchema).default([]),
  /** Replacement string per PII type. Falls back to type-based tag like [PII:email] */
  replacements: z.record(piiTypeSchema, z.string()).optional(),
});
export type RedactorConfig = z.infer<typeof redactorConfigSchema>;

// ── K-anonymity ────────────────────────────────────────────────

export const kAnonConfigSchema = z.object({
  /** Minimum group size threshold */
  k: z.number().int().min(2).default(25),
  /** Column keys for quasi-identifier grouping */
  quasiIdentifiers: z.array(z.string()).min(1),
  /** Domain context (used for default k if not overridden) */
  domain: z.enum(['general', 'healthcare', 'legal', 'financial']).default('general'),
});
export type KAnonConfig = z.infer<typeof kAnonConfigSchema>;

export const kAnonGroupResultSchema = z.object({
  groupKey: z.record(z.string(), z.unknown()),
  count: z.number().int().min(1),
  passes: z.boolean(),
});
export type KAnonGroupResult = z.infer<typeof kAnonGroupResultSchema>;

export const kAnonReportSchema = z.object({
  passes: z.boolean(),
  totalRows: z.number().int().min(0),
  groupCount: z.number().int().min(0),
  failingGroups: z.array(kAnonGroupResultSchema),
  quasiIdentifiers: z.array(z.string()),
  threshold: z.number().int(),
});
export type KAnonReport = z.infer<typeof kAnonReportSchema>;

// ── Differential privacy ───────────────────────────────────────

export const dpConfigSchema = z.object({
  epsilon: z.number().positive().default(1.0),
  sensitivity: z.number().positive().default(1.0),
});
export type DpConfig = z.infer<typeof dpConfigSchema>;

// ── Synthetic generator ────────────────────────────────────────

export const syntheticColumnSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'date', 'email', 'uuid', 'name']),
  /** For string: max length. For number: [min, max]. */
  constraints: z.record(z.string(), z.unknown()).optional(),
});
export type SyntheticColumn = z.infer<typeof syntheticColumnSchema>;

export const syntheticConfigSchema = z.object({
  columns: z.array(syntheticColumnSchema).min(1),
  rowCount: z.number().int().positive().default(100),
  seed: z.number().int().optional(),
});
export type SyntheticConfig = z.infer<typeof syntheticConfigSchema>;

// ── Consent ────────────────────────────────────────────────────

export const consentTokenSchema = z.object({
  contributionId: z.string().min(1),
  userId: z.string().min(1),
  consented: z.boolean(),
  purposes: z.array(z.string()).default([]),
  expiresAt: z.number().optional(),
});
export type ConsentToken = z.infer<typeof consentTokenSchema>;

// ── Audit ──────────────────────────────────────────────────────

export const auditEntrySchema = z.object({
  workspaceId: z.string().uuid(),
  datasetKind: z.string().min(1),
  kAnon: z.number().int().optional(),
  dpEpsilon: z.number().optional(),
  redactionRules: z.record(z.string(), z.unknown()).default({}),
  itemCount: z.number().int().default(0),
  sample: z.unknown().optional(),
  signedBy: z.string().optional(),
  signature: z.string().optional(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

// ── DB interface (compatible with @vita/db) ────────────────────

export interface AnonymizationDb {
  insert: (table: string, values: Record<string, unknown>) => Promise<{ id: string }>;
  query: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
}
