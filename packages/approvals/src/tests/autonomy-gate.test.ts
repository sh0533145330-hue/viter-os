import { describe, expect, it } from 'vitest';
import { AutonomyGate } from '../autonomy-gate.js';
import type { ApprovalRequest, AutonomyConfig } from '../types.js';
import { MockDb, silentLogger } from './mock-db.js';

const baseReq: ApprovalRequest = {
  workspaceId: 'ws-1',
  requestedByAgent: 'tom',
  actionTypeKey: 'send_email',
  payload: {},
  autonomyLevel: 'auto_with_limits',
  requestedByUserId: 'user-1',
};

describe('AutonomyGate.evaluate', () => {
  it('requires approval when no config matches', async () => {
    const gate = new AutonomyGate({ db: new MockDb(), logger: silentLogger });
    const out = await gate.evaluate(baseReq, []);
    expect(out.requiresApproval).toBe(true);
    expect(out.autoApprove).toBe(false);
    expect(out.reason).toBe('no_config');
  });

  it('requires approval at suggest level', async () => {
    const gate = new AutonomyGate({ db: new MockDb(), logger: silentLogger });
    const cfg: AutonomyConfig = { agentKey: 'tom', actionTypeKey: 'send_email', level: 'suggest' };
    const out = await gate.evaluate(baseReq, [cfg]);
    expect(out.requiresApproval).toBe(true);
    expect(out.reason).toBe('level_suggest');
  });

  it('requires approval at draft_confirm level', async () => {
    const gate = new AutonomyGate({ db: new MockDb(), logger: silentLogger });
    const cfg: AutonomyConfig = {
      agentKey: 'tom',
      actionTypeKey: 'send_email',
      level: 'draft_confirm',
    };
    const out = await gate.evaluate(baseReq, [cfg]);
    expect(out.reason).toBe('level_draft_confirm');
  });

  it('auto-approves within limits', async () => {
    const gate = new AutonomyGate({ db: new MockDb(), logger: silentLogger });
    const cfg: AutonomyConfig = {
      agentKey: 'tom',
      actionTypeKey: 'send_email',
      level: 'auto_with_limits',
      limits: { valueCapCents: 1000 },
    };
    const out = await gate.evaluate(
      { ...baseReq, payload: { valueCents: 500 } },
      [cfg],
    );
    expect(out.autoApprove).toBe(true);
    expect(out.reason).toBe('auto_within_limits');
  });

  it('blocks when value exceeds cap', async () => {
    const gate = new AutonomyGate({ db: new MockDb(), logger: silentLogger });
    const cfg: AutonomyConfig = {
      agentKey: 'tom',
      actionTypeKey: 'send_email',
      level: 'auto_with_limits',
      limits: { valueCapCents: 1000 },
    };
    const out = await gate.evaluate(
      { ...baseReq, payload: { valueCents: 5000 } },
      [cfg],
    );
    expect(out.autoApprove).toBe(false);
    expect(out.reason).toBe('limits_exceeded');
  });

  it('blocks when daily count exceeded', async () => {
    const db = new MockDb({
      autoApprovedToday: new Map([['ws-1::tom::send_email', 10]]),
    });
    const gate = new AutonomyGate({ db, logger: silentLogger });
    const cfg: AutonomyConfig = {
      agentKey: 'tom',
      actionTypeKey: 'send_email',
      level: 'auto_with_limits',
      limits: { dailyCount: 10 },
    };
    const out = await gate.evaluate(baseReq, [cfg]);
    expect(out.autoApprove).toBe(false);
    expect(out.reason).toBe('limits_exceeded');
  });

  it('auto_with_veto bypasses limits and auto-approves', async () => {
    const gate = new AutonomyGate({ db: new MockDb(), logger: silentLogger });
    const cfg: AutonomyConfig = {
      agentKey: 'tom',
      actionTypeKey: 'send_email',
      level: 'auto_with_veto',
    };
    const out = await gate.evaluate(baseReq, [cfg]);
    expect(out.autoApprove).toBe(true);
    expect(out.reason).toBe('auto_with_veto');
  });

  it('matches wildcard action type', async () => {
    const gate = new AutonomyGate({ db: new MockDb(), logger: silentLogger });
    const cfg: AutonomyConfig = {
      agentKey: 'tom',
      actionTypeKey: '*',
      level: 'auto_with_veto',
    };
    const out = await gate.evaluate(baseReq, [cfg]);
    expect(out.autoApprove).toBe(true);
  });
});
