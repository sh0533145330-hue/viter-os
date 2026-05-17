import { z } from 'zod';

export const billingModelSchema = z.enum(['direct', 'reseller', 'revenue_share', 'bundled']);
export type BillingModel = z.infer<typeof billingModelSchema>;

export const meterKindSchema = z.enum([
  'tokens', 'runs', 'voice_minutes', 'scraper_minutes', 'storage_gb', 'seat_hours',
]);
export type MeterKind = z.infer<typeof meterKindSchema>;

export interface BillingConfig {
  id: string;
  scope: 'platform' | 'agency' | 'workspace';
  scopeId: string;
  model: BillingModel;
  stripeAccountId?: string;
  pricing: PricingConfig;
  active: boolean;
  effectiveFrom: Date;
}

export interface PricingConfig {
  currency: string;
  base?: { amountCents: number; intervalMonths: number };
  perSeat?: { amountCents: number };
  meters?: Partial<Record<MeterKind, { unitCents: number; freeAllowance?: number }>>;
  revShare?: { vitaPct: number; agencyPct: number };
  bundle?: { includedSeats: number; includedTokens: number; includedRuns: number };
}

export interface MeterReading {
  workspaceId: string;
  meter: MeterKind;
  units: number;
  costCents: number;
  period: string;
  recordedAt: Date;
}

export interface BudgetState {
  workspaceId: string;
  period: string;
  capCents: number;
  spentCents: number;
  warningThresholdPct: number;
  hardStopThresholdPct: number;
}

export class BudgetExceededError extends Error {
  constructor(public readonly state: BudgetState) {
    super(`Budget exceeded: $${state.spentCents / 100} / $${state.capCents / 100}`);
    this.name = 'BudgetExceededError';
  }
}

export interface Logger {
  info(msg: string, data?: object): void;
  warn(msg: string, data?: object): void;
  error(msg: string, data?: object): void;
}

export interface Db {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}
