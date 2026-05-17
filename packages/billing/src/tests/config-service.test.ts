import { describe, it, expect, beforeEach } from 'vitest';
import { BillingConfigService } from '../config-service.js';
import { MockDb } from './mock-db.js';

const logger = { info: () => {}, warn: () => {}, error: () => {} };

describe('BillingConfigService', () => {
  let db: MockDb;
  let svc: BillingConfigService;
  beforeEach(() => { db = new MockDb(); svc = new BillingConfigService({ db, logger }); });

  it('upserts a config', async () => {
    db.nextRows.push([{ id: 'b-1' }]);
    const result = await svc.upsert({
      scope: 'workspace', scopeId: 'ws-1', model: 'direct',
      pricing: { currency: 'USD' }, active: true, effectiveFrom: new Date(),
    });
    expect(result.id).toBe('b-1');
    expect(db.calls[0]?.sql).toContain('INSERT INTO billing_configs');
  });

  it('returns workspace config when present', async () => {
    db.nextRows.push([{
      id: 'b-1', scope: 'workspace', scope_id: 'ws-1', model: 'direct',
      stripe_account_id: null, pricing: { currency: 'USD' }, active: true, effective_from: '2026-01-01',
    }]);
    const result = await svc.getActiveFor('workspace', 'ws-1');
    expect(result?.model).toBe('direct');
  });

  it('returns undefined when not found', async () => {
    db.nextRows.push([]);
    const result = await svc.getActiveFor('workspace', 'ws-missing');
    expect(result).toBeUndefined();
  });

  it('falls back to agency config in resolveForWorkspace', async () => {
    db.nextRows.push([]);
    db.nextRows.push([{
      id: 'b-2', scope: 'agency', scope_id: 'a-1', model: 'reseller',
      stripe_account_id: 'acct_1', pricing: { currency: 'USD' }, active: true, effective_from: '2026-01-01',
    }]);
    const result = await svc.resolveForWorkspace('ws-1', 'a-1');
    expect(result?.model).toBe('reseller');
  });

  it('deactivates a config', async () => {
    await svc.deactivate('b-1');
    expect(db.calls[0]?.sql).toContain('SET active = false');
  });

  it('parses pricing from JSON string', async () => {
    db.nextRows.push([{
      id: 'b-1', scope: 'workspace', scope_id: 'ws-1', model: 'direct',
      stripe_account_id: null, pricing: '{"currency":"EUR"}', active: true, effective_from: '2026-01-01',
    }]);
    const result = await svc.getActiveFor('workspace', 'ws-1');
    expect(result?.pricing.currency).toBe('EUR');
  });
});
