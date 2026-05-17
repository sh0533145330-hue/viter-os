import { describe, expect, it } from 'vitest';
import { ApprovalService } from '../approval.js';
import { EscalationEngine } from '../escalation.js';
import { ApprovalRouter } from '../routing.js';
import { MockDb, silentLogger } from './mock-db.js';

async function seedExpired(
  db: MockDb,
  svc: ApprovalService,
  now: Date,
  targetUserId = 'user-1',
) {
  const result = await svc.create({
    workspaceId: 'ws-1',
    requestedByAgent: 'tom',
    actionTypeKey: 'send_email',
    payload: {},
    autonomyLevel: 'draft_confirm',
    requestedByUserId: targetUserId,
    expiresAt: new Date(now.getTime() - 60_000),
  });
  return result;
}

describe('EscalationEngine.runEscalations', () => {
  it('escalates to manager when policy allows', async () => {
    const db = new MockDb({
      managers: new Map([['ws-1::user-1', 'mgr-1']]),
    });
    const svc = new ApprovalService({ db, logger: silentLogger });
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const engine = new EscalationEngine({
      db,
      approvalService: svc,
      router,
      logger: silentLogger,
      policy: {
        initialTimeoutMinutes: 30,
        escalateToManager: true,
        escalateToTeam: false,
        finalAction: 'expire',
      },
    });
    const now = new Date('2026-05-13T12:00:00Z');
    const { id } = await seedExpired(db, svc, now);
    const out = await engine.runEscalations(now);
    expect(out.escalated).toBe(1);
    expect(out.expired).toBe(0);
    const row = await db.getApproval(id);
    expect(row?.status).toBe('pending');
    expect(row?.expiresAt?.getTime()).toBe(now.getTime() + 30 * 60_000);
    expect(out.escalations[0]?.escalatedTo).toBe('mgr-1');
    expect(db.actions.find((a) => a.routeKind === 'escalation')).toBeDefined();
  });

  it('expires when no escalation target is available', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const engine = new EscalationEngine({
      db,
      approvalService: svc,
      router,
      logger: silentLogger,
    });
    const now = new Date('2026-05-13T12:00:00Z');
    const { id } = await seedExpired(db, svc, now);
    const out = await engine.runEscalations(now);
    expect(out.expired).toBe(1);
    expect(out.escalated).toBe(0);
    const row = await db.getApproval(id);
    expect(row?.status).toBe('expired');
  });

  it('expires on second pass when already escalated', async () => {
    const db = new MockDb({
      managers: new Map([['ws-1::user-1', 'mgr-1']]),
    });
    const svc = new ApprovalService({ db, logger: silentLogger });
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const engine = new EscalationEngine({
      db,
      approvalService: svc,
      router,
      logger: silentLogger,
      policy: {
        initialTimeoutMinutes: 30,
        escalateToManager: true,
        escalateToTeam: false,
        finalAction: 'expire',
      },
    });
    const t1 = new Date('2026-05-13T12:00:00Z');
    const { id } = await seedExpired(db, svc, t1);
    await engine.runEscalations(t1);
    const t2 = new Date(t1.getTime() + 60 * 60_000);
    const out = await engine.runEscalations(t2);
    expect(out.expired).toBe(1);
    const row = await db.getApproval(id);
    expect(row?.status).toBe('expired');
  });

  it('finalAction reject auto-rejects', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const engine = new EscalationEngine({
      db,
      approvalService: svc,
      router,
      logger: silentLogger,
      policy: {
        initialTimeoutMinutes: 5,
        escalateToManager: false,
        escalateToTeam: false,
        finalAction: 'reject',
      },
    });
    const now = new Date();
    const { id } = await seedExpired(db, svc, now);
    await engine.runEscalations(now);
    const row = await db.getApproval(id);
    expect(row?.status).toBe('rejected');
    expect(row?.decisionReason).toMatch(/escalation timeout/);
  });

  it('does not touch non-expired pending approvals', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const engine = new EscalationEngine({
      db,
      approvalService: svc,
      router,
      logger: silentLogger,
    });
    const now = new Date();
    await svc.create({
      workspaceId: 'ws-1',
      requestedByAgent: 'tom',
      actionTypeKey: 'send_email',
      payload: {},
      autonomyLevel: 'draft_confirm',
      requestedByUserId: 'user-1',
      expiresAt: new Date(now.getTime() + 60 * 60_000),
    });
    const out = await engine.runEscalations(now);
    expect(out.escalated).toBe(0);
    expect(out.expired).toBe(0);
  });

  it('escalates to team_lead when configured', async () => {
    const db = new MockDb({
      teamLeads: new Map([['ws-1::user-1', 'lead-1']]),
    });
    const svc = new ApprovalService({ db, logger: silentLogger });
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const engine = new EscalationEngine({
      db,
      approvalService: svc,
      router,
      logger: silentLogger,
      policy: {
        initialTimeoutMinutes: 10,
        escalateToManager: false,
        escalateToTeam: true,
        finalAction: 'expire',
      },
    });
    const now = new Date();
    await seedExpired(db, svc, now);
    const out = await engine.runEscalations(now);
    expect(out.escalated).toBe(1);
    expect(out.escalations[0]?.escalatedTo).toBe('lead-1');
  });
});
