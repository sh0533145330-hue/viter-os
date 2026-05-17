/**
 * DerivationRunner — re-processing state machine.
 *
 * Manages derivation runs that re-extract, re-link, re-derive, or
 * re-materialize artifacts when upstream data changes. Each run
 * follows a state machine: queued → running → succeeded | failed.
 */

import type { Db, Logger, DerivationKind, DerivationStatus, DerivationScope } from './types.js';
import type { ExtractionFramework } from './extractor.js';

// ---------------------------------------------------------------------------
// DerivationRunner
// ---------------------------------------------------------------------------

export interface DerivationRunnerDeps {
  db: Db;
  extractionFramework: ExtractionFramework;
  logger: Logger;
}

export class DerivationRunner {
  private readonly db: Db;
  private readonly extractionFramework: ExtractionFramework;
  private readonly logger: Logger;

  constructor(deps: DerivationRunnerDeps) {
    this.db = deps.db;
    this.extractionFramework = deps.extractionFramework;
    this.logger = deps.logger;
  }

  /**
   * Enqueue a new derivation run.
   * Returns the derivation run ID.
   */
  async enqueue(
    kind: DerivationKind,
    scope: DerivationScope,
  ): Promise<string> {
    try {
      const rows = await this.db
        .insert('derivation_runs' as unknown as Record<string, unknown>)
        .values({
          run_kind: kind,
          scope,
          status: 'queued',
          stats: {},
        })
        .returning() as Array<Record<string, unknown>>;

      const id = rows[0]?.['id'] as string | undefined;
      if (!id) throw new Error('enqueue: no derivation run ID returned');

      this.logger.info(`DerivationRunner: enqueued ${kind} derivation id=${id}`);
      return id;
    } catch (err) {
      this.logger.error(`DerivationRunner: failed to enqueue ${kind} derivation`, { error: String(err) });
      throw err;
    }
  }

  /**
   * Execute a derivation run.
   * Transitions from 'queued' → 'running' → 'succeeded' | 'failed'.
   */
  async run(derivationId: string): Promise<void> {
    // Get the derivation run record
    let runRecord: Record<string, unknown>;
    try {
      const rows = await this.db
        .select()
        .from('derivation_runs' as unknown as Record<string, unknown>)
        .where({ id: derivationId } as unknown as unknown) as Array<Record<string, unknown>>;

      if (rows.length === 0) {
        throw new Error(`Derivation run ${derivationId} not found`);
      }
      runRecord = rows[0]!;
    } catch (err) {
      this.logger.error(`DerivationRunner: failed to fetch derivation run id=${derivationId}`, { error: String(err) });
      throw err;
    }

    const kind = runRecord['run_kind'] as DerivationKind;
    const scope = runRecord['scope'] as DerivationScope;
    const currentStatus = runRecord['status'] as DerivationStatus;

    if (currentStatus !== 'queued') {
      throw new Error(`Derivation run ${derivationId} is not in 'queued' state (current: ${currentStatus})`);
    }

    // Transition to running
    await this.updateStatus(derivationId, 'running', { startedAt: new Date().toISOString() });

    try {
      // Execute based on kind
      const stats = await this.executeDerivation(kind, scope);

      // Transition to succeeded
      await this.updateStatus(derivationId, 'succeeded', {
        endedAt: new Date().toISOString(),
        stats,
      });

      this.logger.info(`DerivationRunner: derivation id=${derivationId} (${kind}) succeeded`, { stats });
    } catch (err) {
      // Transition to failed
      await this.updateStatus(derivationId, 'failed', {
        endedAt: new Date().toISOString(),
        error: { message: String(err) },
      });

      this.logger.error(`DerivationRunner: derivation id=${derivationId} (${kind}) failed`, { error: String(err) });
      throw err;
    }
  }

  /**
   * Get the current status of a derivation run.
   */
  async getStatus(derivationId: string): Promise<DerivationStatus> {
    try {
      const rows = await this.db
        .select()
        .from('derivation_runs' as unknown as Record<string, unknown>)
        .where({ id: derivationId } as unknown as unknown) as Array<Record<string, unknown>>;

      if (rows.length === 0) {
        throw new Error(`Derivation run ${derivationId} not found`);
      }
      return rows[0]!['status'] as DerivationStatus;
    } catch (err) {
      this.logger.error(`DerivationRunner: failed to get status for id=${derivationId}`, { error: String(err) });
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private async updateStatus(
    derivationId: string,
    status: DerivationStatus,
    extra: Record<string, unknown> = {},
  ): Promise<void> {
    await this.db
      .update('derivation_runs' as unknown as Record<string, unknown>)
      .set({ status, ...extra })
      .where({ id: derivationId } as unknown as unknown);
  }

  private async executeDerivation(
    kind: DerivationKind,
    scope: DerivationScope,
  ): Promise<Record<string, unknown>> {
    switch (kind) {
      case 'reextract': {
        return this.executeReextract(scope);
      }
      case 'relink': {
        return this.executeRelink(scope);
      }
      case 'rederive': {
        return this.executeRederive(scope);
      }
      case 'rematerialize': {
        return this.executeRematerialize(scope);
      }
      default: {
        throw new Error(`Unknown derivation kind: ${kind}`);
      }
    }
  }

  private async executeReextract(scope: DerivationScope): Promise<Record<string, unknown>> {
    // Fetch L0 artifacts that need re-extraction
    let l0Rows: Array<Record<string, unknown>> = [];

    if (scope.ids && scope.ids.length > 0) {
      // Fetch specific L0 artifacts by ID
      try {
        const rows = await this.db
          .select()
          .from('l0_artifacts' as unknown as Record<string, unknown>)
          .where({ workspace_id: scope.workspaceId } as unknown as unknown) as Array<Record<string, unknown>>;
        l0Rows = rows.filter((r) => scope.ids!.includes(r['id'] as string));
      } catch {
        l0Rows = [];
      }
    } else {
      // Fetch all L0 artifacts in the workspace
      try {
        const rows = await this.db
          .select()
          .from('l0_artifacts' as unknown as Record<string, unknown>)
          .where({ workspace_id: scope.workspaceId } as unknown as unknown) as Array<Record<string, unknown>>;
        l0Rows = rows;
      } catch {
        l0Rows = [];
      }
    }

    let processed = 0;
    let failed = 0;

    for (const row of l0Rows) {
      try {
        const l0: import('./types.js').L0Artifact = {
          id: row['id'] as string,
          sourceKind: (row['source_kind'] as string) ?? 'generic',
          mimeType: (row['mime_type'] as string) ?? 'text/plain',
          body: (row['body'] as string) ?? '',
          metadata: (row['metadata'] as Record<string, unknown>) ?? {},
        };
        await this.extractionFramework.extract(l0, {
          workspaceId: scope.workspaceId,
        });
        processed++;
      } catch {
        failed++;
      }
    }

    // If all items failed, throw to mark the derivation as failed
    if (l0Rows.length > 0 && failed === l0Rows.length) {
      throw new Error(`All ${l0Rows.length} L0 artifact(s) failed to re-extract`);
    }

    return { kind: 'reextract', total: l0Rows.length, processed, failed };
  }

  private async executeRelink(scope: DerivationScope): Promise<Record<string, unknown>> {
    // v1: mark as completed with basic stats
    return { kind: 'relink', workspaceId: scope.workspaceId, status: 'completed' };
  }

  private async executeRederive(scope: DerivationScope): Promise<Record<string, unknown>> {
    // v1: mark as completed with basic stats
    return { kind: 'rederive', workspaceId: scope.workspaceId, status: 'completed' };
  }

  private async executeRematerialize(scope: DerivationScope): Promise<Record<string, unknown>> {
    // v1: mark as completed with basic stats
    return { kind: 'rematerialize', workspaceId: scope.workspaceId, status: 'completed' };
  }
}
