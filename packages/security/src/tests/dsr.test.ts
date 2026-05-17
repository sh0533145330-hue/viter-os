import { describe, expect, it } from 'vitest';
import { DsrHandler } from '../dsr.js';

describe('DsrHandler', () => {
  it('receives a DSR and sets a 30-day deadline', () => {
    const handler = new DsrHandler();
    const dsr = handler.receive({
      type: 'access',
      subjectId: 'sub-1',
      email: 'alice@example.com',
      workspaceId: 'ws-1',
    });

    expect(dsr.id).toBeTruthy();
    expect(dsr.type).toBe('access');
    expect(dsr.status).toBe('received');
    expect(dsr.completedAt).toBeNull();

    const dueDate = new Date(dsr.dueAt);
    const receivedDate = new Date(dsr.receivedAt);
    const diffDays =
      (dueDate.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  it('updates status through the lifecycle', () => {
    const handler = new DsrHandler();
    const dsr = handler.receive({
      type: 'erasure',
      subjectId: 'sub-2',
      email: 'bob@example.com',
      workspaceId: 'ws-1',
    });

    const verifying = handler.updateStatus(dsr.id, 'verifying');
    expect(verifying.status).toBe('verifying');

    const inProgress = handler.updateStatus(dsr.id, 'in_progress');
    expect(inProgress.status).toBe('in_progress');

    const completed = handler.updateStatus(dsr.id, 'completed');
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeTruthy();
  });

  it('throws when updating unknown DSR', () => {
    const handler = new DsrHandler();
    expect(() => handler.updateStatus('unknown', 'completed')).toThrow(
      'DSR unknown not found',
    );
  });

  it('filters by workspace', () => {
    const handler = new DsrHandler();
    handler.receive({
      type: 'access',
      subjectId: 's1',
      email: 'a@a.com',
      workspaceId: 'ws-A',
    });
    handler.receive({
      type: 'erasure',
      subjectId: 's2',
      email: 'b@b.com',
      workspaceId: 'ws-B',
    });
    handler.receive({
      type: 'rectification',
      subjectId: 's3',
      email: 'c@c.com',
      workspaceId: 'ws-A',
    });

    const wsA = handler.getByWorkspace('ws-A');
    expect(wsA).toHaveLength(2);
    const wsB = handler.getByWorkspace('ws-B');
    expect(wsB).toHaveLength(1);
  });

  it('detects overdue requests', () => {
    const handler = new DsrHandler();

    // Manually create an overdue request
    const dsr = handler.receive({
      type: 'access',
      subjectId: 'old',
      email: 'old@example.com',
      workspaceId: 'ws',
    });

    // Hack: make it overdue by setting dueAt in the past
    const pastDue = {
      ...dsr,
      dueAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    };
    // Force this in
    (handler as unknown as { requests: Map<string, typeof dsr> }).requests.set(
      dsr.id,
      pastDue,
    );

    const overdue = handler.getOverdue();
    expect(overdue.length).toBeGreaterThanOrEqual(1);
    expect(overdue[0]!.id).toBe(dsr.id);
  });

  it('getById returns correct request', () => {
    const handler = new DsrHandler();
    const dsr = handler.receive({
      type: 'access',
      subjectId: 's',
      email: 'x@x.com',
      workspaceId: 'w',
    });

    const found = handler.getById(dsr.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(dsr.id);

    expect(handler.getById('nope')).toBeUndefined();
  });

  it('returns GDPR article references', () => {
    const handler = new DsrHandler();
    expect(handler.getGdprArticles('access')).toEqual(['Art. 15']);
    expect(handler.getGdprArticles('erasure')).toEqual(['Art. 17']);
    expect(handler.getGdprArticles('data_portability')).toEqual(['Art. 20']);
  });

  it('getDeadlineDays returns 30 for all types', () => {
    const handler = new DsrHandler();
    expect(handler.getDeadlineDays('access')).toBe(30);
    expect(handler.getDeadlineDays('erasure')).toBe(30);
  });
});
