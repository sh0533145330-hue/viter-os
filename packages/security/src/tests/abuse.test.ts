import { describe, expect, it } from 'vitest';
import { AbuseManager } from '../abuse.js';

describe('AbuseManager', () => {
  it('files an abuse report', () => {
    const manager = new AbuseManager();
    const report = manager.report({
      workspaceId: 'ws-1',
      reporterId: 'user-a',
      reportedUserId: 'user-b',
      category: 'spam',
      description: 'User is sending unsolicited messages',
    });

    expect(report.id).toBeTruthy();
    expect(report.status).toBe('open');
    expect(report.category).toBe('spam');
    expect(report.resolvedAt).toBeNull();
  });

  it('resolves a report', () => {
    const manager = new AbuseManager();
    const report = manager.report({
      workspaceId: 'ws',
      reporterId: 'a',
      reportedUserId: 'b',
      category: 'harassment',
      description: 'Bad behavior',
    });

    const resolved = manager.resolveReport(report.id, 'resolved');
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedAt).toBeTruthy();
  });

  it('throws when resolving unknown report', () => {
    const manager = new AbuseManager();
    expect(() => manager.resolveReport('unknown', 'resolved')).toThrow(
      'Abuse report unknown not found',
    );
  });

  it('applies suspension and checks standing', () => {
    const manager = new AbuseManager();

    expect(manager.getStanding('target-1')).toBe('good');

    manager.applyAction('target-1', 'suspend');
    expect(manager.getStanding('target-1')).toBe('suspended');

    manager.applyAction('target-1', 'unsuspend');
    expect(manager.getStanding('target-1')).toBe('good');

    manager.applyAction('target-1', 'ban');
    expect(manager.getStanding('target-1')).toBe('banned');
  });

  it('isAllowed returns false for suspended/banned', () => {
    const manager = new AbuseManager();

    expect(manager.isAllowed('t1')).toBe(true);

    manager.applyAction('t1', 'warn');
    expect(manager.isAllowed('t1')).toBe(true);

    manager.applyAction('t1', 'suspend');
    expect(manager.isAllowed('t1')).toBe(false);

    manager.applyAction('t1', 'unsuspend');
    expect(manager.isAllowed('t1')).toBe(true);

    manager.applyAction('t1', 'ban');
    expect(manager.isAllowed('t1')).toBe(false);
  });

  it('filters reports by workspace', () => {
    const manager = new AbuseManager();
    manager.report({
      workspaceId: 'ws-A',
      reporterId: 'r1',
      reportedUserId: 't1',
      category: 'spam',
      description: 'spam',
    });
    manager.report({
      workspaceId: 'ws-A',
      reporterId: 'r2',
      reportedUserId: 't2',
      category: 'phishing',
      description: 'phish',
    });
    manager.report({
      workspaceId: 'ws-B',
      reporterId: 'r3',
      reportedUserId: 't3',
      category: 'malware',
      description: 'virus',
    });

    expect(manager.getReportsByWorkspace('ws-A')).toHaveLength(2);
    expect(manager.getReportsByWorkspace('ws-B')).toHaveLength(1);
    expect(manager.getReportsByWorkspace('ws-C')).toHaveLength(0);
  });

  it('lists open reports', () => {
    const manager = new AbuseManager();
    const r1 = manager.report({
      workspaceId: 'ws',
      reporterId: 'a',
      reportedUserId: 'b',
      category: 'spam',
      description: 'x',
    });
    const r2 = manager.report({
      workspaceId: 'ws',
      reporterId: 'a',
      reportedUserId: 'c',
      category: 'harassment',
      description: 'y',
    });

    manager.resolveReport(r2.id, 'resolved');

    const open = manager.getOpenReports();
    expect(open).toHaveLength(1);
    expect(open[0]!.id).toBe(r1.id);
  });
});
