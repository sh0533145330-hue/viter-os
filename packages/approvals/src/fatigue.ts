import type { Db, FatigueConfig, Logger } from './types.js';

export interface FatigueProtectionDeps {
  db: Db;
  logger: Logger;
  config: FatigueConfig;
}

const DEFAULT_CONFIG: FatigueConfig = {
  maxApprovalsPerHour: 12,
  bundlingWindowMs: 60_000,
  autoPromoteAfterCount: 25,
};

export class FatigueProtection {
  private readonly db: Db;
  private readonly logger: Logger;
  private readonly config: FatigueConfig;
  private readonly autoPromoteCounters: Map<string, number> = new Map();

  constructor(deps: FatigueProtectionDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
    this.config = { ...DEFAULT_CONFIG, ...deps.config };
  }

  async shouldBundle(userId: string, workspaceId: string): Promise<boolean> {
    const decisions = await this.db.countDecisionsInWindow(
      userId,
      workspaceId,
      this.config.bundlingWindowMs,
    );
    if (decisions <= 1) return false;
    const hourly = await this.db.countDecisionsInWindow(userId, workspaceId, 60 * 60_000);
    const bundle = hourly >= this.config.maxApprovalsPerHour;
    if (bundle) {
      this.logger.info('approval.bundle_recommended', {
        userId,
        workspaceId,
        hourly,
        cap: this.config.maxApprovalsPerHour,
      });
    }
    return bundle;
  }

  async tryAutoPromote(userId: string, actionTypeKey: string): Promise<boolean> {
    const key = `${userId}::${actionTypeKey}`;
    const current = (this.autoPromoteCounters.get(key) ?? 0) + 1;
    this.autoPromoteCounters.set(key, current);
    if (current >= this.config.autoPromoteAfterCount) {
      this.logger.info('autonomy.promotion_suggested', {
        userId,
        actionTypeKey,
        count: current,
      });
      return true;
    }
    return false;
  }

  getCounter(userId: string, actionTypeKey: string): number {
    return this.autoPromoteCounters.get(`${userId}::${actionTypeKey}`) ?? 0;
  }

  reset(userId?: string, actionTypeKey?: string): void {
    if (userId === undefined || actionTypeKey === undefined) {
      this.autoPromoteCounters.clear();
      return;
    }
    this.autoPromoteCounters.delete(`${userId}::${actionTypeKey}`);
  }
}
