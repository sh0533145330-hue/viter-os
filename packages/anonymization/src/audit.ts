import type { AuditEntry } from './types.js';
import { auditEntrySchema } from './types.js';

/**
 * Minimal DB interface that matches what AnonymizationAuditor needs.
 * The real implementation will be injected from @vita/db.
 */
export interface AuditDb {
  insertAnonymizationAudit: (entry: AuditEntry) => Promise<{ id: string }>;
}

/**
 * AnonymizationAuditor writes anonymization audit records.
 * Each anonymization operation (redaction, k-anon check, DP application)
 * should produce an audit trail row.
 */
export class AnonymizationAuditor {
  private readonly db: AuditDb;

  constructor(db: AuditDb) {
    this.db = db;
  }

  /**
   * Record an anonymization event.
   */
  async record(entry: AuditEntry): Promise<{ id: string }> {
    const validated = auditEntrySchema.parse(entry);
    return this.db.insertAnonymizationAudit(validated);
  }

  /**
   * Create a no-op auditor for testing or when audit is disabled.
   */
  static noop(): AnonymizationAuditor {
    return new AnonymizationAuditor({
      insertAnonymizationAudit: async () => ({ id: 'noop-audit-id' }),
    });
  }
}
