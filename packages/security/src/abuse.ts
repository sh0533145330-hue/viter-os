import type { AbuseReport, SuspensionAction } from './types.js';
import { abuseReportSchema } from './types.js';

/**
 * Status of a workspace/user for abuse management purposes.
 */
export type WorkspaceStanding = 'good' | 'warned' | 'suspended' | 'banned';

/**
 * AbuseManager handles abuse reports and workspace/user suspensions.
 */
export class AbuseManager {
  private reports: Map<string, AbuseReport> = new Map();
  private standings: Map<string, WorkspaceStanding> = new Map();

  /**
   * File a new abuse report.
   */
  report(report: {
    workspaceId: string;
    reporterId: string;
    reportedUserId: string;
    category: AbuseReport['category'];
    description: string;
    evidence?: string[];
  }): AbuseReport {
    const entry: AbuseReport = {
      id: `ab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      workspaceId: report.workspaceId,
      reporterId: report.reporterId,
      reportedUserId: report.reportedUserId,
      category: report.category,
      description: report.description,
      evidence: report.evidence ?? [],
      status: 'open',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    const validated = abuseReportSchema.parse(entry);
    this.reports.set(validated.id, validated);
    return validated;
  }

  /**
   * Apply an action to a workspace/user.
   */
  applyAction(targetId: string, action: SuspensionAction): WorkspaceStanding {
    switch (action) {
      case 'suspend':
        this.standings.set(targetId, 'suspended');
        break;
      case 'warn':
        this.standings.set(targetId, 'warned');
        break;
      case 'ban':
        this.standings.set(targetId, 'banned');
        break;
      case 'unsuspend':
        this.standings.set(targetId, 'good');
        break;
    }
    return this.standings.get(targetId) ?? 'good';
  }

  /**
   * Get the current standing of a workspace/user.
   */
  getStanding(targetId: string): WorkspaceStanding {
    return this.standings.get(targetId) ?? 'good';
  }

  /**
   * Check if a workspace/user is allowed to operate.
   */
  isAllowed(targetId: string): boolean {
    const standing = this.getStanding(targetId);
    return standing === 'good' || standing === 'warned';
  }

  /**
   * Resolve an abuse report.
   */
  resolveReport(
    reportId: string,
    status: 'resolved' | 'dismissed',
  ): AbuseReport {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Abuse report ${reportId} not found`);
    }

    const updated: AbuseReport = {
      ...report,
      status,
      resolvedAt: new Date().toISOString(),
    };

    this.reports.set(reportId, updated);
    return updated;
  }

  /**
   * Get all reports for a workspace.
   */
  getReportsByWorkspace(workspaceId: string): AbuseReport[] {
    return [...this.reports.values()].filter(
      (r) => r.workspaceId === workspaceId,
    );
  }

  /**
   * Get all open reports.
   */
  getOpenReports(): AbuseReport[] {
    return [...this.reports.values()].filter((r) => r.status === 'open');
  }
}
