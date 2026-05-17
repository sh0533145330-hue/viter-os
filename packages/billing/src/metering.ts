import type { MeterKind, MeterReading, PricingConfig, Logger, Db } from './types.js';

export class MeteringService {
  constructor(private deps: { db: Db; logger: Logger }) {}

  computeCost(meter: MeterKind, units: number, pricing: PricingConfig): number {
    const cfg = pricing.meters?.[meter];
    if (!cfg) return 0;
    const billable = Math.max(0, units - (cfg.freeAllowance ?? 0));
    return Math.ceil(billable * cfg.unitCents);
  }

  async record(reading: Omit<MeterReading, 'costCents' | 'recordedAt'> & { costCents?: number }): Promise<MeterReading> {
    const full: MeterReading = {
      workspaceId: reading.workspaceId,
      meter: reading.meter,
      units: reading.units,
      costCents: reading.costCents ?? 0,
      period: reading.period,
      recordedAt: new Date(),
    };
    await this.deps.db.query(
      `INSERT INTO cost_meters (workspace_id, meter_kind, period, units, cost_cents)
       VALUES ($1, $2, $3, $4, $5)`,
      [full.workspaceId, full.meter, full.period, full.units, full.costCents]
    );
    return full;
  }

  async aggregateByPeriod(workspaceId: string, period: string): Promise<{ totalCents: number; byMeter: Record<string, number> }> {
    const result = await this.deps.db.query(
      `SELECT meter_kind, SUM(units) AS units, SUM(cost_cents) AS cost_cents
       FROM cost_meters
       WHERE workspace_id = $1 AND period = $2
       GROUP BY meter_kind`,
      [workspaceId, period]
    );
    let total = 0;
    const byMeter: Record<string, number> = {};
    for (const row of result.rows) {
      const cost = Number(row['cost_cents'] ?? 0);
      const kind = String(row['meter_kind'] ?? '');
      byMeter[kind] = cost;
      total += cost;
    }
    return { totalCents: total, byMeter };
  }
}

export function currentPeriod(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
