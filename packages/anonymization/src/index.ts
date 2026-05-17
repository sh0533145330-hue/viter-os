export { PiiRedactor } from './redactor.js';
export { KAnonymityChecker } from './k-anonymity.js';
export { LaplaceNoise } from './differential-privacy.js';
export { SyntheticGenerator } from './synthetic.js';
export { AnonymizationAuditor } from './audit.js';
export type { AuditDb } from './audit.js';
export { ConsentManager } from './consent.js';
export { getPatterns, getDefaultTag } from './patterns.js';
export type { PiiPattern } from './patterns.js';

export type {
  PiiType,
  PiiMatch,
  StrictnessLevel,
  RedactionResult,
  TaggedRedactionResult,
  RedactorConfig,
  KAnonConfig,
  KAnonGroupResult,
  KAnonReport,
  DpConfig,
  SyntheticColumn,
  SyntheticConfig,
  ConsentToken,
  AuditEntry,
  AnonymizationDb,
} from './types.js';

export {
  piiTypeSchema,
  piiMatchSchema,
  strictnessLevelSchema,
  redactorConfigSchema,
  kAnonConfigSchema,
  kAnonReportSchema,
  dpConfigSchema,
  syntheticColumnSchema,
  syntheticConfigSchema,
  consentTokenSchema,
  auditEntrySchema,
} from './types.js';

export const VERSION = '0.0.0';
