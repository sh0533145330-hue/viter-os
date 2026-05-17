import { describe, expect, it } from 'vitest';
import { ApprovalRouter } from '../routing.js';
import type { ApprovalRequest, RoutingRule } from '../types.js';
import { MockDb, silentLogger } from './mock-db.js';

function req(over: Partial<ApprovalRequest> = {}): ApprovalRequest {
  return {
    workspaceId: 'ws-1',
    requestedByAgent: 'tom',
    actionTypeKey: 'send_email',
    payload: {},
    autonomyLevel: 'draft_confirm',
    requestedByUserId: 'user-1',
    ...over,
  };
}

describe('ApprovalRouter', () => {
  it('routes user_self to the requesting user', async () => {
    const db = new MockDb();
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const targets = await router.route(req(), [{ kind: 'user_self' }]);
    expect(targets).toEqual(['user-1']);
  });

  it('routes to explicit user_self target if provided', async () => {
    const db = new MockDb();
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const targets = await router.route(req(), [{ kind: 'user_self', targetUserId: 'user-99' }]);
    expect(targets).toEqual(['user-99']);
  });

  it('routes to team_lead via Db resolution', async () => {
    const db = new MockDb({ teamLeads: new Map([['ws-1::user-1', 'lead-1']]) });
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const targets = await router.route(req(), [{ kind: 'team_lead' }]);
    expect(targets).toEqual(['lead-1']);
  });

  it('routes to manager via Db resolution', async () => {
    const db = new MockDb({ managers: new Map([['ws-1::user-1', 'mgr-1']]) });
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const targets = await router.route(req(), [{ kind: 'manager' }]);
    expect(targets).toEqual(['mgr-1']);
  });

  it('skips a rule whose condition returns false', async () => {
    const db = new MockDb();
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const rules: RoutingRule[] = [
      { kind: 'user_self', condition: (r) => r.actionTypeKey === 'unused' },
    ];
    const targets = await router.route(req(), rules);
    expect(targets).toEqual([]);
  });

  it('deduplicates targets across rules', async () => {
    const db = new MockDb({
      managers: new Map([['ws-1::user-1', 'user-1']]),
    });
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const targets = await router.route(req(), [
      { kind: 'user_self' },
      { kind: 'manager' },
    ]);
    expect(targets).toEqual(['user-1']);
  });

  it('returns empty when seed user not provided and no targetUserId', async () => {
    const db = new MockDb();
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const targets = await router.route(req({ requestedByUserId: undefined }) as ApprovalRequest, [
      { kind: 'team_lead' },
    ]);
    expect(targets).toEqual([]);
  });

  it('policy rule with explicit target adds target', async () => {
    const db = new MockDb();
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const targets = await router.route(req(), [
      { kind: 'policy', targetUserId: 'compliance-bot' },
    ]);
    expect(targets).toEqual(['compliance-bot']);
  });

  it('omits team_lead target when no lead found', async () => {
    const db = new MockDb();
    const router = new ApprovalRouter({ db, logger: silentLogger });
    const targets = await router.route(req(), [{ kind: 'team_lead' }]);
    expect(targets).toEqual([]);
  });
});
