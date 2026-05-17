import { describe, expect, it } from 'vitest';
import { FatigueProtection } from '../fatigue.js';
import { MockDb, silentLogger } from './mock-db.js';

describe('FatigueProtection.shouldBundle', () => {
  it('does not bundle for a single decision', async () => {
    const db = new MockDb();
    const fp = new FatigueProtection({
      db,
      logger: silentLogger,
      config: { maxApprovalsPerHour: 5, bundlingWindowMs: 60_000, autoPromoteAfterCount: 100 },
    });
    db.decisionLog.push({ userId: 'u', workspaceId: 'w', at: new Date() });
    expect(await fp.shouldBundle('u', 'w')).toBe(false);
  });

  it('bundles when hourly cap is reached', async () => {
    const db = new MockDb();
    const fp = new FatigueProtection({
      db,
      logger: silentLogger,
      config: { maxApprovalsPerHour: 3, bundlingWindowMs: 60_000, autoPromoteAfterCount: 100 },
    });
    for (let i = 0; i < 5; i++) {
      db.decisionLog.push({ userId: 'u', workspaceId: 'w', at: new Date() });
    }
    expect(await fp.shouldBundle('u', 'w')).toBe(true);
  });

  it('does not bundle below hourly cap even with multiple recent', async () => {
    const db = new MockDb();
    const fp = new FatigueProtection({
      db,
      logger: silentLogger,
      config: { maxApprovalsPerHour: 100, bundlingWindowMs: 60_000, autoPromoteAfterCount: 100 },
    });
    for (let i = 0; i < 3; i++) {
      db.decisionLog.push({ userId: 'u', workspaceId: 'w', at: new Date() });
    }
    expect(await fp.shouldBundle('u', 'w')).toBe(false);
  });
});

describe('FatigueProtection.tryAutoPromote', () => {
  it('returns false until threshold is reached', async () => {
    const fp = new FatigueProtection({
      db: new MockDb(),
      logger: silentLogger,
      config: { maxApprovalsPerHour: 5, bundlingWindowMs: 60_000, autoPromoteAfterCount: 3 },
    });
    expect(await fp.tryAutoPromote('u', 'send_email')).toBe(false);
    expect(await fp.tryAutoPromote('u', 'send_email')).toBe(false);
    expect(await fp.tryAutoPromote('u', 'send_email')).toBe(true);
  });

  it('tracks per (user, actionType) independently', async () => {
    const fp = new FatigueProtection({
      db: new MockDb(),
      logger: silentLogger,
      config: { maxApprovalsPerHour: 5, bundlingWindowMs: 60_000, autoPromoteAfterCount: 2 },
    });
    await fp.tryAutoPromote('u1', 'a');
    await fp.tryAutoPromote('u2', 'a');
    expect(fp.getCounter('u1', 'a')).toBe(1);
    expect(fp.getCounter('u2', 'a')).toBe(1);
    expect(fp.getCounter('u1', 'b')).toBe(0);
  });

  it('reset clears counters', async () => {
    const fp = new FatigueProtection({
      db: new MockDb(),
      logger: silentLogger,
      config: { maxApprovalsPerHour: 5, bundlingWindowMs: 60_000, autoPromoteAfterCount: 2 },
    });
    await fp.tryAutoPromote('u', 'a');
    fp.reset();
    expect(fp.getCounter('u', 'a')).toBe(0);
  });

  it('reset with key clears only that counter', async () => {
    const fp = new FatigueProtection({
      db: new MockDb(),
      logger: silentLogger,
      config: { maxApprovalsPerHour: 5, bundlingWindowMs: 60_000, autoPromoteAfterCount: 2 },
    });
    await fp.tryAutoPromote('u', 'a');
    await fp.tryAutoPromote('u', 'b');
    fp.reset('u', 'a');
    expect(fp.getCounter('u', 'a')).toBe(0);
    expect(fp.getCounter('u', 'b')).toBe(1);
  });
});
