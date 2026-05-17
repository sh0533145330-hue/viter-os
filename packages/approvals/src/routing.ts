import type { ApprovalRequest, Db, Logger, RoutingRule } from './types.js';

export interface ApprovalRouterDeps {
  db: Db;
  logger: Logger;
}

export class ApprovalRouter {
  private readonly db: Db;
  private readonly logger: Logger;

  constructor(deps: ApprovalRouterDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
  }

  async route(req: ApprovalRequest, rules: RoutingRule[]): Promise<string[]> {
    const targets = new Set<string>();
    for (const rule of rules) {
      if (rule.condition && !rule.condition(req)) continue;

      switch (rule.kind) {
        case 'user_self': {
          const target = rule.targetUserId ?? req.requestedByUserId;
          if (target) targets.add(target);
          break;
        }
        case 'team_lead': {
          const seed = rule.targetUserId ?? req.requestedByUserId;
          if (!seed) break;
          const lead = await this.resolveTeamLead(req.workspaceId, seed);
          if (lead) targets.add(lead);
          break;
        }
        case 'manager': {
          const seed = rule.targetUserId ?? req.requestedByUserId;
          if (!seed) break;
          const mgr = await this.resolveManager(req.workspaceId, seed);
          if (mgr) targets.add(mgr);
          break;
        }
        case 'policy': {
          if (rule.targetUserId) targets.add(rule.targetUserId);
          break;
        }
      }
    }
    this.logger.debug?.('approval.routed', {
      workspaceId: req.workspaceId,
      targetCount: targets.size,
    });
    return Array.from(targets);
  }

  async resolveTeamLead(workspaceId: string, userId: string): Promise<string | null> {
    return this.db.resolveTeamLead(workspaceId, userId);
  }

  async resolveManager(workspaceId: string, userId: string): Promise<string | null> {
    return this.db.resolveManager(workspaceId, userId);
  }
}
