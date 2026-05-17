import { describe, expect, it } from 'vitest';
import { ApprovalService } from '../approval.js';
import { MockDb, silentLogger } from './mock-db.js';

function baseReq() {
  return {
    workspaceId: 'ws-1',
    requestedByAgent: 'tom',
    actionTypeKey: 'send_email',
    payload: { to: 'alice@example.com' },
    autonomyLevel: 'draft_confirm' as const,
    requestedByUserId: 'user-1',
  };
}

describe('ApprovalService.create', () => {
  it('inserts a pending approval', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const res = await svc.create(baseReq());
    expect(res.status).toBe('pending');
    expect(res.existed).toBe(false);
    expect(db.approvals.length).toBe(1);
    expect(db.approvals[0]?.status).toBe('pending');
    expect(db.approvals[0]?.targetUserId).toBe('user-1');
  });

  it('returns the existing row when idempotency key matches', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const first = await svc.create({ ...baseReq(), idempotencyKey: 'k-1' });
    const second = await svc.create({ ...baseReq(), idempotencyKey: 'k-1' });
    expect(second.id).toBe(first.id);
    expect(second.existed).toBe(true);
    expect(db.approvals.length).toBe(1);
  });

  it('treats different idempotency keys as separate approvals', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    await svc.create({ ...baseReq(), idempotencyKey: 'k-1' });
    await svc.create({ ...baseReq(), idempotencyKey: 'k-2' });
    expect(db.approvals.length).toBe(2);
  });

  it('rejects invalid request payloads via Zod', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    await expect(
      svc.create({ ...baseReq(), workspaceId: '' } as unknown as ReturnType<typeof baseReq>),
    ).rejects.toThrow();
  });
});

describe('ApprovalService.approve / reject', () => {
  it('marks an approval approved', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const { id } = await svc.create(baseReq());
    await svc.approve(id, 'reviewer-1', 'looks good');
    const row = await db.getApproval(id);
    expect(row?.status).toBe('approved');
    expect(row?.decidedBy).toBe('reviewer-1');
    expect(row?.decisionReason).toBe('looks good');
  });

  it('marks an approval rejected', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const { id } = await svc.create(baseReq());
    await svc.reject(id, 'reviewer-2', 'nope');
    const row = await db.getApproval(id);
    expect(row?.status).toBe('rejected');
    expect(row?.decisionReason).toBe('nope');
  });

  it('throws when approving a non-pending approval', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const { id } = await svc.create(baseReq());
    await svc.approve(id, 'reviewer-1');
    await expect(svc.approve(id, 'reviewer-1')).rejects.toThrow(/not pending/);
  });

  it('throws when approving a missing approval', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    await expect(svc.approve('missing-id', 'reviewer-1')).rejects.toThrow(/not found/);
  });
});

describe('ApprovalService.expire / autoApprove / list', () => {
  it('expires only pending approvals', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const { id } = await svc.create(baseReq());
    await svc.expire(id);
    const row = await db.getApproval(id);
    expect(row?.status).toBe('expired');
    await svc.expire(id);
    const row2 = await db.getApproval(id);
    expect(row2?.status).toBe('expired');
  });

  it('autoApprove sets auto_approved', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    const { id } = await svc.create(baseReq());
    await svc.autoApprove(id, 'within autonomy limits');
    const row = await db.getApproval(id);
    expect(row?.status).toBe('auto_approved');
    expect(row?.decisionReason).toBe('within autonomy limits');
  });

  it('listPending filters by workspace and optional user', async () => {
    const db = new MockDb();
    const svc = new ApprovalService({ db, logger: silentLogger });
    await svc.create({ ...baseReq(), requestedByUserId: 'user-1' });
    await svc.create({ ...baseReq(), requestedByUserId: 'user-2' });
    await svc.create({ ...baseReq(), workspaceId: 'ws-2', requestedByUserId: 'user-1' });
    expect((await svc.listPending('ws-1')).length).toBe(2);
    expect((await svc.listPending('ws-1', 'user-1')).length).toBe(1);
    expect((await svc.listPending('ws-2')).length).toBe(1);
  });
});
