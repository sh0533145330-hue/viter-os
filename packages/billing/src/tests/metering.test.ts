import { describe, it, expect, beforeEach } from 'vitest';
import { MeteringService, currentPeriod } from '../metering.js';
import { MockDb } from './mock-db.js';

const logger = { info: () => {}, warn: () => {}, error: () => {} };

describe('MeteringService', () => {
  let db: MockDb;
  let svc: MeteringService;
  beforeEach(() => {
    db = new MockDb();
    svc = new MeteringService({ db, logger });
  });

  it('computes cost with free allowance', () => {
    const cost = svc.computeCost('tokens', 1500, { currency: 'USD', meters: { tokens: { unitCents: 1, freeAllowance: 1000 } } });
    expect(cost).toBe(500);
  });

  it('returns 0 when meter unconfigured', () => {
    expect(svc.computeCost('tokens', 100, { currency: 'USD' })).toBe(0);
  });

  it('records meter reading', async () => {
    await svc.record({ workspaceId: 'ws-1', meter: 'tokens', units: 100, period: '2026-05', costCents: 50 });
    expect(db.calls).toHaveLength(1);
    expect(db.calls[0]?.sql).toContain('INSERT INTO cost_meters');
    expect(db.calls[0]?.params).toEqual(['ws-1', 'tokens', '2026-05', 100, 50]);
  });

  it('aggregates by period', async () => {
    db.rows = [
      { meter_kind: 'tokens', units: 1000, cost_cents: 100 },
      { meter_kind: 'runs', units: 5, cost_cents: 50 },
    ];
    const result = await svc.aggregateByPeriod('ws-1', '2026-05');
    expect(result.totalCents).toBe(150);
    expect(result.byMeter['tokens']).toBe(100);
    expect(result.byMeter['runs']).toBe(50);
  });

  it('formats current period as YYYY-MM', () => {
    const period = currentPeriod(new Date('2026-05-13T00:00:00Z'));
    expect(period).toBe('2026-05');
  });
});
