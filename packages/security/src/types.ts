import { z } from 'zod';

// ── Break-glass ───────────────────────────────────────────────

export const breakGlassConfigSchema = z.object({
  /** Require explicit consent before any output leaves the boundary */
  requireConsent: z.boolean().default(true),
  /** Force anonymization of all outputs */
  forceAnonymization: z.boolean().default(true),
  /** Minimum k-anonymity threshold for break-glass outputs */
  kAnonThreshold: z.number().int().min(2).default(50),
  /** Require a reason to be recorded */
  requireReason: z.boolean().default(true),
  /** Auto-expire break-glass sessions after N minutes */
  sessionTimeoutMinutes: z.number().positive().default(15),
});
export type BreakGlassConfig = z.infer<typeof breakGlassConfigSchema>;

export const breakGlassSessionSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  reason: z.string().min(1),
  config: breakGlassConfigSchema,
  createdAt: z.string(),
  expiresAt: z.string(),
  closedAt: z.string().nullable(),
});
export type BreakGlassSession = z.infer<typeof breakGlassSessionSchema>;

// ── DSR (Data Subject Request) ────────────────────────────────

export const dsrTypeSchema = z.enum([
  'access',
  'rectification',
  'erasure',
  'restrict_processing',
  'data_portability',
  'object',
  'automated_decision',
]);
export type DsrType = z.infer<typeof dsrTypeSchema>;

export const dsrStatusSchema = z.enum([
  'received',
  'verifying',
  'in_progress',
  'completed',
  'rejected',
  'extended',
]);
export type DsrStatus = z.infer<typeof dsrStatusSchema>;

export const dsrRequestSchema = z.object({
  id: z.string().min(1),
  type: dsrTypeSchema,
  subjectId: z.string().min(1),
  email: z.string().email(),
  workspaceId: z.string().min(1),
  status: dsrStatusSchema,
  details: z.string().optional(),
  receivedAt: z.string(),
  dueAt: z.string(), // regulatory deadline
  completedAt: z.string().nullable(),
  notes: z.string().optional(),
});
export type DsrRequest = z.infer<typeof dsrRequestSchema>;

// ── Abuse ─────────────────────────────────────────────────────

export const abuseReportSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  reporterId: z.string().min(1),
  reportedUserId: z.string().min(1),
  category: z.enum(['spam', 'harassment', 'phishing', 'malware', 'inappropriate', 'other']),
  description: z.string().min(1),
  evidence: z.array(z.string()).default([]),
  status: z.enum(['open', 'investigating', 'resolved', 'dismissed']).default('open'),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
});
export type AbuseReport = z.infer<typeof abuseReportSchema>;

export const suspensionActionSchema = z.enum(['suspend', 'unsuspend', 'warn', 'ban']);
export type SuspensionAction = z.infer<typeof suspensionActionSchema>;

// ── Compliance ────────────────────────────────────────────────

export const complianceFrameworkSchema = z.enum(['soc2', 'gdpr', 'ccpa', 'hipaa', 'iso27001']);
export type ComplianceFramework = z.infer<typeof complianceFrameworkSchema>;

export const controlMappingSchema = z.object({
  framework: complianceFrameworkSchema,
  controlId: z.string(),
  title: z.string(),
  description: z.string(),
  vitaComponent: z.string(),
  implementationStatus: z.enum(['implemented', 'partial', 'planned', 'not_applicable']),
});
export type ControlMapping = z.infer<typeof controlMappingSchema>;
