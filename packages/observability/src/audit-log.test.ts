import { describe, expect, it } from 'vitest';
import { AuditLogger } from './audit-log.js';
import type { AuditEvent } from './types.js';

function makeEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    workspaceId: 'ws-001',
    actorKind: 'user',
    actorId: 'user-1',
    action: 'create',
    resource: 'workflow',
    at: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('AuditLogger', () => {
  it('records an audit event', async () => {
    const db = AuditLogger.memoryDb();
    const logger = new AuditLogger({ db });
    const event = makeEvent();
    const result = await logger.record(event);
    expect(result.id).toBeTruthy();
    expect(db.events).toHaveLength(1);
  });

  it('redacts PII in before/after fields', async () => {
    const db = AuditLogger.memoryDb();
    const logger = new AuditLogger({ db });
    const event = makeEvent({
      before: { password: 'secret123', email: 'alice@test.com', name: 'visible' },
      after: { password: 'newpass', email: 'bob@test.com', name: 'visible' },
    });
    await logger.record(event);
    const recorded = db.events[0]!;
    const before = recorded.before as Record<string, unknown>;
    const after = recorded.after as Record<string, unknown>;
    expect(before.password).toBe('[REDACTED]');
    expect(before.email).toBe('[REDACTED]');
    expect(before.name).toBe('visible');
    expect(after.password).toBe('[REDACTED]');
  });

  it('queries events by workspace', async () => {
    const db = AuditLogger.memoryDb();
    const logger = new AuditLogger({ db });
    await logger.record(makeEvent({ workspaceId: 'ws-a' }));
    await logger.record(makeEvent({ workspaceId: 'ws-b' }));
    await logger.record(makeEvent({ workspaceId: 'ws-a' }));

    const results = await logger.query({ workspaceId: 'ws-a' });
    expect(results).toHaveLength(2);
  });

  it('queries events with filters', async () => {
    const db = AuditLogger.memoryDb();
    const logger = new AuditLogger({ db });
    await logger.record(makeEvent({ action: 'create', resource: 'workflow' }));
    await logger.record(makeEvent({ action: 'delete', resource: 'workflow' }));
    await logger.record(makeEvent({ action: 'create', resource: 'agent' }));

    const results = await logger.query({
      workspaceId: 'ws-001',
      action: 'create',
      resource: 'workflow',
    });
    expect(results).toHaveLength(1);
  });

  it('queries events with date range', async () => {
    const db = AuditLogger.memoryDb();
    const logger = new AuditLogger({ db });
    await logger.record(makeEvent({ at: new Date('2025-01-10') }));
    await logger.record(makeEvent({ at: new Date('2025-02-10') }));
    await logger.record(makeEvent({ at: new Date('2025-03-10') }));

    const results = await logger.query({
      workspaceId: 'ws-001',
      from: new Date('2025-02-01'),
      to: new Date('2025-02-28'),
    });
    expect(results).toHaveLength(1);
  });

  it('respects limit in queries', async () => {
    const db = AuditLogger.memoryDb();
    const logger = new AuditLogger({ db });
    for (let i = 0; i < 20; i++) {
      await logger.record(makeEvent());
    }
    const results = await logger.query({ workspaceId: 'ws-001', limit: 5 });
    expect(results).toHaveLength(5);
  });

  it('memoryDb insertAuditEvent returns sequential IDs', async () => {
    const db = AuditLogger.memoryDb();
    const r1 = await db.insertAuditEvent(makeEvent());
    const r2 = await db.insertAuditEvent(makeEvent());
    expect(r1.id).not.toBe(r2.id);
  });

  it('custom redactor overrides default', async () => {
    const db = AuditLogger.memoryDb();
    const customRedactor = (obj: unknown): unknown => {
      if (typeof obj === 'object' && obj !== null) {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          out[k] = typeof v === 'string' ? v.toUpperCase() : v;
        }
        return out;
      }
      return obj;
    };
    const logger = new AuditLogger({ db, redactor: customRedactor });
    await logger.record(makeEvent({ before: { name: 'alice' } }));
    const recorded = db.events[0]!;
    const before = recorded.before as Record<string, unknown>;
    expect(before.name).toBe('ALICE');
  });
});
