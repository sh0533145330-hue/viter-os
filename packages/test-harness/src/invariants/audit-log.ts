export interface StateChange {
  readonly id: string;
  readonly table: string;
  readonly action: 'insert' | 'update' | 'delete';
  readonly workspaceId: string;
  readonly actorId: string | null;
  readonly occurredAt: string;
}

export interface AuditLogEntry {
  readonly id: string;
  readonly subjectId: string;
  readonly table: string;
  readonly action: StateChange['action'];
  readonly workspaceId: string;
  readonly actorId: string | null;
  readonly occurredAt: string;
}

export interface AuditMissing {
  readonly stateChangeId: string;
  readonly table: string;
  readonly reason: 'missing-audit' | 'workspace-mismatch';
}

export interface AuditReport {
  readonly missing: readonly AuditMissing[];
  readonly stateChangesChecked: number;
  readonly auditEntriesChecked: number;
  readonly passed: boolean;
}

/**
 * Asserts that every state change has a matching audit_log entry with the same
 * workspace_id. Returns a structured report of missing or mismatched audits.
 */
export function checkAuditCompleteness(
  stateChanges: readonly StateChange[],
  auditLog: readonly AuditLogEntry[],
): AuditReport {
  const auditsBySubject = new Map<string, AuditLogEntry[]>();
  for (const a of auditLog) {
    const list = auditsBySubject.get(a.subjectId);
    if (list) {
      list.push(a);
    } else {
      auditsBySubject.set(a.subjectId, [a]);
    }
  }

  const missing: AuditMissing[] = [];
  for (const sc of stateChanges) {
    const candidates = auditsBySubject.get(sc.id) ?? [];
    const match = candidates.find((a) => a.table === sc.table && a.action === sc.action);
    if (!match) {
      missing.push({
        stateChangeId: sc.id,
        table: sc.table,
        reason: 'missing-audit',
      });
      continue;
    }
    if (match.workspaceId !== sc.workspaceId) {
      missing.push({
        stateChangeId: sc.id,
        table: sc.table,
        reason: 'workspace-mismatch',
      });
    }
  }

  return {
    missing,
    stateChangesChecked: stateChanges.length,
    auditEntriesChecked: auditLog.length,
    passed: missing.length === 0,
  };
}
