import type { BillingConfig, BillingModel, Db, Logger } from './types.js';
import { billingModelSchema } from './types.js';

export class BillingConfigService {
  constructor(private deps: { db: Db; logger: Logger }) {}

  async upsert(config: Omit<BillingConfig, 'id'>): Promise<BillingConfig> {
    billingModelSchema.parse(config.model);
    const result = await this.deps.db.query(
      `INSERT INTO billing_configs (scope, scope_id, model, stripe_account_id, pricing, active, effective_from)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [config.scope, config.scopeId, config.model, config.stripeAccountId ?? null, JSON.stringify(config.pricing), config.active, config.effectiveFrom],
    );
    const id = String(result.rows[0]?.['id'] ?? '');
    return { ...config, id };
  }

  async getActiveFor(scope: 'platform' | 'agency' | 'workspace', scopeId: string): Promise<BillingConfig | undefined> {
    const result = await this.deps.db.query(
      `SELECT id, scope, scope_id, model, stripe_account_id, pricing, active, effective_from
       FROM billing_configs
       WHERE scope = $1 AND scope_id = $2 AND active = true
       ORDER BY effective_from DESC LIMIT 1`,
      [scope, scopeId],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    const config: BillingConfig = {
      id: String(row['id']),
      scope: row['scope'] as 'platform' | 'agency' | 'workspace',
      scopeId: String(row['scope_id']),
      model: row['model'] as BillingModel,
      pricing: typeof row['pricing'] === 'string' ? JSON.parse(row['pricing']) : row['pricing'],
      active: Boolean(row['active']),
      effectiveFrom: new Date(String(row['effective_from'])),
    };
    if (row['stripe_account_id']) config.stripeAccountId = String(row['stripe_account_id']);
    return config;
  }

  async resolveForWorkspace(workspaceId: string, agencyId?: string): Promise<BillingConfig | undefined> {
    const workspace = await this.getActiveFor('workspace', workspaceId);
    if (workspace) return workspace;
    if (agencyId) {
      const agency = await this.getActiveFor('agency', agencyId);
      if (agency) return agency;
    }
    return undefined;
  }

  async deactivate(configId: string): Promise<void> {
    await this.deps.db.query(`UPDATE billing_configs SET active = false WHERE id = $1`, [configId]);
  }
}
