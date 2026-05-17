import type {
  ApprovalRequest,
  AutonomyConfig,
  AutonomyEvaluation,
  Db,
  Logger,
} from './types.js';

export interface AutonomyGateDeps {
  db: Db;
  logger: Logger;
}

export class AutonomyGate {
  private readonly db: Db;
  private readonly logger: Logger;

  constructor(deps: AutonomyGateDeps) {
    this.db = deps.db;
    this.logger = deps.logger;
  }

  async evaluate(req: ApprovalRequest, configs: AutonomyConfig[]): Promise<AutonomyEvaluation> {
    const actionTypeKey = req.actionTypeKey;
    const match = configs.find(
      (c) =>
        c.agentKey === req.requestedByAgent &&
        (c.actionTypeKey === actionTypeKey || c.actionTypeKey === '*'),
    );

    if (!match) {
      return { requiresApproval: true, autoApprove: false, reason: 'no_config' };
    }

    const evaluation: AutonomyEvaluation = {
      requiresApproval: true,
      autoApprove: false,
      matchedConfig: match,
    };

    if (match.level === 'suggest') {
      evaluation.reason = 'level_suggest';
      return evaluation;
    }
    if (match.level === 'draft_confirm') {
      evaluation.reason = 'level_draft_confirm';
      return evaluation;
    }

    if (match.level === 'auto_with_limits') {
      if (match.limits) {
        if (match.limits.valueCapCents !== undefined) {
          const value = readNumber(req.payload, 'valueCents');
          if (value !== null && value > match.limits.valueCapCents) {
            this.logger.info('autonomy.limit_value_exceeded', {
              workspaceId: req.workspaceId,
              value,
              cap: match.limits.valueCapCents,
            });
            return {
              requiresApproval: true,
              autoApprove: false,
              matchedConfig: match,
              reason: 'limits_exceeded',
            };
          }
        }
        if (match.limits.dailyCount !== undefined) {
          const used = await this.db.countAutoApprovedToday(
            req.workspaceId,
            match.agentKey,
            match.actionTypeKey,
          );
          if (used >= match.limits.dailyCount) {
            this.logger.info('autonomy.limit_daily_exceeded', {
              workspaceId: req.workspaceId,
              used,
              cap: match.limits.dailyCount,
            });
            return {
              requiresApproval: true,
              autoApprove: false,
              matchedConfig: match,
              reason: 'limits_exceeded',
            };
          }
        }
      }
      return {
        requiresApproval: false,
        autoApprove: true,
        matchedConfig: match,
        reason: 'auto_within_limits',
      };
    }

    return {
      requiresApproval: false,
      autoApprove: true,
      matchedConfig: match,
      reason: 'auto_with_veto',
    };
  }
}

function readNumber(payload: Record<string, unknown>, key: string): number | null {
  const v = payload[key];
  return typeof v === 'number' ? v : null;
}
