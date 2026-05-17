import { describe, expect, it } from 'vitest';
import { BreakGlassService } from '../break-glass.js';

describe('BreakGlassService', () => {
  it('opens a session with required reason', () => {
    const service = new BreakGlassService({ requireReason: true });
    const session = service.openSession({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reason: 'Emergency data access for incident #42',
    });

    expect(session.id).toBeTruthy();
    expect(session.workspaceId).toBe('ws-1');
    expect(session.userId).toBe('user-1');
    expect(session.reason).toBe('Emergency data access for incident #42');
    expect(session.closedAt).toBeNull();
    expect(session.expiresAt).toBeTruthy();
  });

  it('new session is immediately valid', () => {
    const service = new BreakGlassService();
    const session = service.openSession({
      workspaceId: 'ws',
      userId: 'u',
      reason: 'test',
    });
    expect(service.isSessionValid(session.id)).toBe(true);
  });

  it('closed session is no longer valid', () => {
    const service = new BreakGlassService();
    const session = service.openSession({
      workspaceId: 'ws',
      userId: 'u',
      reason: 'test',
    });
    service.closeSession(session.id);
    expect(service.isSessionValid(session.id)).toBe(false);
  });

  it('unknown session ID is not valid', () => {
    const service = new BreakGlassService();
    expect(service.isSessionValid('nonexistent')).toBe(false);
  });

  it('session expires after timeout', async () => {
    const service = new BreakGlassService({ sessionTimeoutMinutes: 0.001 }); // ~60ms
    const session = service.openSession({
      workspaceId: 'ws',
      userId: 'u',
      reason: 'test',
    });

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(service.isSessionValid(session.id)).toBe(false);
  });

  it('reports active session count', () => {
    const service = new BreakGlassService();
    expect(service.getActiveSessionCount()).toBe(0);

    service.openSession({ workspaceId: 'a', userId: 'u', reason: 'r1' });
    expect(service.getActiveSessionCount()).toBe(1);

    service.openSession({ workspaceId: 'b', userId: 'v', reason: 'r2' });
    expect(service.getActiveSessionCount()).toBe(2);
  });

  it('cleanupExpired removes expired sessions', async () => {
    const service = new BreakGlassService({ sessionTimeoutMinutes: 0.001 });
    service.openSession({ workspaceId: 'ws', userId: 'u', reason: 't' });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(service.getActiveSessionCount()).toBe(1); // still counted until cleanup
    service.cleanupExpired();
    expect(service.getActiveSessionCount()).toBe(0);
  });

  it('sanitizeOutput marks content as redacted when forceAnonymization is on', () => {
    const service = new BreakGlassService({ forceAnonymization: true });
    const result = service.sanitizeOutput('Sensitive patient data here');
    expect(result.redacted).toBe(true);
    expect(result.auditRequired).toBe(true);
    expect(result.safe).toContain('[BREAK-GLASS SANITIZED]');
  });

  it('sanitizeOutput preserves content when forceAnonymization is off', () => {
    const service = new BreakGlassService({ forceAnonymization: false });
    const result = service.sanitizeOutput('Normal data');
    expect(result.redacted).toBe(false);
    expect(result.safe).toBe('Normal data');
  });

  it('getConfig returns current configuration', () => {
    const service = new BreakGlassService({ kAnonThreshold: 50 });
    const config = service.getConfig();
    expect(config.kAnonThreshold).toBe(50);
    expect(config.requireConsent).toBe(true);
    expect(config.forceAnonymization).toBe(true);
  });
});
