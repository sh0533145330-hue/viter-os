import {
  type ApprovalRequest,
  ApprovalRequestSchema,
  type ApprovalRow,
  type ApprovalStatus,
  type Db,
  type Logger,
} from './types.js';

export interface ApprovalServiceDeps {
  db: Db;
  logger: Logger;
}

export class ApprovalService {
  private readonly db: Db;
  private readonly logger: Logger;

  constructor(deps: ApprovalServiceDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
  }

  async create(req: ApprovalRequest): Promise<{ id: string; status: ApprovalStatus; existed: boolean }> {
    const parsed = ApprovalRequestSchema.parse(req);

    if (parsed.idempotencyKey) {
      const existing = await this.db.findApprovalByIdempotencyKey(
        parsed.workspaceId,
        parsed.idempotencyKey,
      );
      if (existing) {
        this.logger.debug?.('approval.create idempotent hit', {
          approvalId: existing.id,
        });
        return { id: existing.id, status: existing.status, existed: true };
      }
    }

    const payload: Record<string, unknown> = { ...parsed.payload };
    if (parsed.idempotencyKey) {
      payload.__idempotency_key = parsed.idempotencyKey;
    }

    const insert: Omit<ApprovalRow, 'id' | 'createdAt' | 'updatedAt'> = {
      workspaceId: parsed.workspaceId,
      requestedByAgent: parsed.requestedByAgent,
      payload,
      status: 'pending',
      autonomyLevel: parsed.autonomyLevel,
    };
    if (parsed.actionTypeKey !== undefined) insert.actionTypeKey = parsed.actionTypeKey;
    if (parsed.requestedByUserId !== undefined) insert.targetUserId = parsed.requestedByUserId;
    if (parsed.summary !== undefined) insert.summary = parsed.summary;
    if (parsed.expiresAt !== undefined) insert.expiresAt = parsed.expiresAt;

    const row = await this.db.insertApproval(insert);
    this.logger.info('approval.created', {
      approvalId: row.id,
      workspaceId: parsed.workspaceId,
    });
    return { id: row.id, status: row.status, existed: false };
  }

  async approve(approvalId: string, userId: string, rationale?: string): Promise<void> {
    const current = await this.db.getApproval(approvalId);
    if (!current) throw new Error(`Approval ${approvalId} not found`);
    if (current.status !== 'pending') {
      throw new Error(`Approval ${approvalId} is not pending (status=${current.status})`);
    }
    const patch: Partial<ApprovalRow> = {
      status: 'approved',
      decidedBy: userId,
      decidedAt: new Date(),
    };
    if (rationale !== undefined) patch.decisionReason = rationale;
    await this.db.updateApproval(approvalId, patch);
    this.logger.info('approval.approved', { approvalId, userId });
  }

  async reject(approvalId: string, userId: string, rationale?: string): Promise<void> {
    const current = await this.db.getApproval(approvalId);
    if (!current) throw new Error(`Approval ${approvalId} not found`);
    if (current.status !== 'pending') {
      throw new Error(`Approval ${approvalId} is not pending (status=${current.status})`);
    }
    const patch: Partial<ApprovalRow> = {
      status: 'rejected',
      decidedBy: userId,
      decidedAt: new Date(),
    };
    if (rationale !== undefined) patch.decisionReason = rationale;
    await this.db.updateApproval(approvalId, patch);
    this.logger.info('approval.rejected', { approvalId, userId });
  }

  async expire(approvalId: string): Promise<void> {
    const current = await this.db.getApproval(approvalId);
    if (!current) throw new Error(`Approval ${approvalId} not found`);
    if (current.status !== 'pending') return;
    await this.db.updateApproval(approvalId, {
      status: 'expired',
      decidedAt: new Date(),
    });
    this.logger.info('approval.expired', { approvalId });
  }

  async autoApprove(approvalId: string, rationale?: string): Promise<void> {
    const current = await this.db.getApproval(approvalId);
    if (!current) throw new Error(`Approval ${approvalId} not found`);
    if (current.status !== 'pending') return;
    const patch: Partial<ApprovalRow> = {
      status: 'auto_approved',
      decidedAt: new Date(),
    };
    if (rationale !== undefined) patch.decisionReason = rationale;
    await this.db.updateApproval(approvalId, patch);
    this.logger.info('approval.auto_approved', { approvalId });
  }

  async listPending(workspaceId: string, userId?: string): Promise<ApprovalRow[]> {
    return this.db.listPendingApprovals(workspaceId, userId);
  }
}
