import type {
  ApprovalActionRow,
  ApprovalRow,
  Db,
} from '../types.js';

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

export interface MockDbOptions {
  teamLeads?: Map<string, string>;
  managers?: Map<string, string>;
  autoApprovedToday?: Map<string, number>;
}

export class MockDb implements Db {
  approvals: ApprovalRow[] = [];
  actions: ApprovalActionRow[] = [];
  decisionLog: Array<{ userId: string; workspaceId: string; at: Date }> = [];
  teamLeads: Map<string, string>;
  managers: Map<string, string>;
  autoApprovedToday: Map<string, number>;

  constructor(opts: MockDbOptions = {}) {
    this.teamLeads = opts.teamLeads ?? new Map();
    this.managers = opts.managers ?? new Map();
    this.autoApprovedToday = opts.autoApprovedToday ?? new Map();
  }

  async insertApproval(input: Omit<ApprovalRow, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalRow> {
    const now = new Date();
    const row: ApprovalRow = {
      ...input,
      id: makeId('appr'),
      createdAt: now,
      updatedAt: now,
    };
    this.approvals.push(row);
    return row;
  }

  async updateApproval(id: string, patch: Partial<ApprovalRow>): Promise<ApprovalRow | null> {
    const idx = this.approvals.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    const current = this.approvals[idx];
    if (!current) return null;
    const merged: ApprovalRow = { ...current, ...patch, updatedAt: new Date() };
    this.approvals[idx] = merged;
    if (patch.status && patch.status !== 'pending' && current.targetUserId) {
      this.decisionLog.push({
        userId: current.targetUserId,
        workspaceId: current.workspaceId,
        at: new Date(),
      });
    }
    return merged;
  }

  async getApproval(id: string): Promise<ApprovalRow | null> {
    return this.approvals.find((a) => a.id === id) ?? null;
  }

  async findApprovalByIdempotencyKey(
    workspaceId: string,
    key: string,
  ): Promise<ApprovalRow | null> {
    return (
      this.approvals.find(
        (a) => a.workspaceId === workspaceId && a.payload['__idempotency_key'] === key,
      ) ?? null
    );
  }

  async listPendingApprovals(workspaceId: string, userId?: string): Promise<ApprovalRow[]> {
    return this.approvals.filter(
      (a) =>
        a.workspaceId === workspaceId &&
        a.status === 'pending' &&
        (userId === undefined || a.targetUserId === userId),
    );
  }

  async listExpiredPending(now: Date): Promise<ApprovalRow[]> {
    return this.approvals.filter(
      (a) => a.status === 'pending' && a.expiresAt !== undefined && a.expiresAt <= now,
    );
  }

  async countDecisionsInWindow(userId: string, workspaceId: string, sinceMs: number): Promise<number> {
    const cutoff = Date.now() - sinceMs;
    return this.decisionLog.filter(
      (d) =>
        d.userId === userId &&
        d.workspaceId === workspaceId &&
        d.at.getTime() >= cutoff,
    ).length;
  }

  async countAutoApprovedToday(
    workspaceId: string,
    agentKey: string,
    actionTypeKey: string,
  ): Promise<number> {
    const key = `${workspaceId}::${agentKey}::${actionTypeKey}`;
    return this.autoApprovedToday.get(key) ?? 0;
  }

  async insertApprovalAction(
    input: Omit<ApprovalActionRow, 'id' | 'createdAt'>,
  ): Promise<ApprovalActionRow> {
    const row: ApprovalActionRow = {
      ...input,
      id: makeId('act'),
      createdAt: new Date(),
    };
    this.actions.push(row);
    return row;
  }

  async resolveTeamLead(workspaceId: string, userId: string): Promise<string | null> {
    return this.teamLeads.get(`${workspaceId}::${userId}`) ?? null;
  }

  async resolveManager(workspaceId: string, userId: string): Promise<string | null> {
    return this.managers.get(`${workspaceId}::${userId}`) ?? null;
  }
}

export const silentLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
};
