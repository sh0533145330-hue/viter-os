import type { DsrRequest, DsrType } from './types.js';
import { dsrRequestSchema } from './types.js';

/**
 * Regulatory deadlines per DSR type (calendar days).
 */
const REGULATORY_DEADLINES: Record<DsrType, number> = {
  access: 30,
  rectification: 30,
  erasure: 30,
  restrict_processing: 30,
  data_portability: 30,
  object: 30,
  automated_decision: 30,
};

/**
 * DsrHandler manages Data Subject Requests per GDPR Articles 15-22 and CCPA.
 */
export class DsrHandler {
  private requests: Map<string, DsrRequest> = new Map();

  /**
   * Receive a new DSR and compute its regulatory deadline.
   */
  receive(request: {
    type: DsrType;
    subjectId: string;
    email: string;
    workspaceId: string;
    details?: string;
  }): DsrRequest {
    const now = new Date();
    const deadlineDays = REGULATORY_DEADLINES[request.type] ?? 30;
    const dueAt = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000);

    const dsr: DsrRequest = {
      id: `dsr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      type: request.type,
      subjectId: request.subjectId,
      email: request.email,
      workspaceId: request.workspaceId,
      status: 'received',
      details: request.details,
      receivedAt: now.toISOString(),
      dueAt: dueAt.toISOString(),
      completedAt: null,
    };

    const validated = dsrRequestSchema.parse(dsr);
    this.requests.set(validated.id, validated);
    return validated;
  }

  /**
   * Update the status of a DSR.
   */
  updateStatus(
    requestId: string,
    status: DsrRequest['status'],
    notes?: string,
  ): DsrRequest {
    const req = this.requests.get(requestId);
    if (!req) {
      throw new Error(`DSR ${requestId} not found`);
    }

    const updated: DsrRequest = {
      ...req,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : req.completedAt,
      notes: notes ?? req.notes,
    };

    const validated = dsrRequestSchema.parse(updated);
    this.requests.set(validated.id, validated);
    return validated;
  }

  /**
   * Get all DSRs for a workspace.
   */
  getByWorkspace(workspaceId: string): DsrRequest[] {
    return [...this.requests.values()].filter(
      (r) => r.workspaceId === workspaceId,
    );
  }

  /**
   * Get all overdue DSRs (past due date, not completed/rejected).
   */
  getOverdue(): DsrRequest[] {
    const now = Date.now();
    return [...this.requests.values()].filter((r) => {
      if (r.status === 'completed' || r.status === 'rejected') return false;
      return new Date(r.dueAt).getTime() < now;
    });
  }

  /**
   * Get a single DSR by ID.
   */
  getById(requestId: string): DsrRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get deadline for a given DSR type.
   */
  getDeadlineDays(type: DsrType): number {
    return REGULATORY_DEADLINES[type] ?? 30;
  }

  /**
   * Returns GDPR article references for each DSR type.
   */
  getGdprArticles(type: DsrType): string[] {
    const mapping: Record<DsrType, string[]> = {
      access: ['Art. 15'],
      rectification: ['Art. 16'],
      erasure: ['Art. 17'],
      restrict_processing: ['Art. 18'],
      data_portability: ['Art. 20'],
      object: ['Art. 21'],
      automated_decision: ['Art. 22'],
    };
    return mapping[type] ?? [];
  }
}
