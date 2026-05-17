import type { ApprovalService } from './approval.js';
import type { ApprovalRouter } from './routing.js';
import type { ApprovalRow, Db, EscalationPolicy, Logger } from './types.js';

export interface EscalationEngineDeps {
  db: Db;
  approvalService: ApprovalService;
  router: ApprovalRouter;
  logger: Logger;
  policy?: EscalationPolicy;
}

const DEFAULT_POLICY: EscalationPolicy = {
  initialTimeoutMinutes: 60,
  escalateToManager: true,
  escalateToTeam: false,
  finalAction: 'expire',
};

export interface EscalationResult {
  escalated: number;
  expired: number;
  escalations: Array<{ approvalId: string; escalatedTo: string }>;
}

export class EscalationEngine {
  private readonly db: Db;
  private readonly approvalService: ApprovalService;
  private readonly router: ApprovalRouter;
  private readonly logger: Logger;
  private readonly policy: EscalationPolicy;

  constructor(deps: EscalationEngineDeps) {
    this.db = deps.db;
    this.approvalService = deps.approvalService;
    this.router = deps.router;
    this.logger = deps.logger;
    this.policy = deps.policy ?? DEFAULT_POLICY;
  }

  async runEscalations(now: Date): Promise<EscalationResult> {
    const expired = await this.db.listExpiredPending(now);
    const result: EscalationResult = { escalated: 0, expired: 0, escalations: [] };

    for (const approval of expired) {
      const alreadyEscalated = this.wasEscalated(approval);
      if (!alreadyEscalated && (this.policy.escalateToManager || this.policy.escalateToTeam)) {
        const targets = await this.resolveEscalationTargets(approval);
        if (targets.length > 0) {
          const extension = this.policy.initialTimeoutMinutes * 60_000;
          const newExpiry = new Date(now.getTime() + extension);
          const payload: Record<string, unknown> = {
            ...approval.payload,
            __escalation: {
              level: this.nextEscalationLevel(approval),
              escalatedAt: now.toISOString(),
              targets,
            },
          };
          await this.db.updateApproval(approval.id, {
            payload,
            expiresAt: newExpiry,
          });
          for (const target of targets) {
            await this.db.insertApprovalAction({
              approvalId: approval.id,
              routeKind: 'escalation',
              channel: 'in_app',
              metadata: { escalatedTo: target },
            });
            result.escalations.push({ approvalId: approval.id, escalatedTo: target });
          }
          result.escalated += 1;
          this.logger.info('approval.escalated', {
            approvalId: approval.id,
            targets,
          });
          continue;
        }
      }

      if (this.policy.finalAction === 'reject') {
        await this.approvalService.reject(approval.id, 'system:escalation', 'auto-rejected after escalation timeout');
      } else {
        await this.approvalService.expire(approval.id);
      }
      result.expired += 1;
    }
    return result;
  }

  private wasEscalated(approval: ApprovalRow): boolean {
    const meta = approval.payload['__escalation'];
    return typeof meta === 'object' && meta !== null;
  }

  private nextEscalationLevel(approval: ApprovalRow): number {
    const meta = approval.payload['__escalation'];
    if (typeof meta === 'object' && meta !== null) {
      const lvl = (meta as { level?: unknown }).level;
      if (typeof lvl === 'number') return lvl + 1;
    }
    return 1;
  }

  private async resolveEscalationTargets(approval: ApprovalRow): Promise<string[]> {
    const seed = approval.targetUserId;
    if (!seed) return [];
    const targets: string[] = [];
    if (this.policy.escalateToManager) {
      const mgr = await this.router.resolveManager(approval.workspaceId, seed);
      if (mgr) targets.push(mgr);
    }
    if (this.policy.escalateToTeam) {
      const lead = await this.router.resolveTeamLead(approval.workspaceId, seed);
      if (lead) targets.push(lead);
    }
    return targets;
  }
}
