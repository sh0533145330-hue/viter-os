/**
 * `@vita/pack-sdk` — deployment logic.
 *
 * When a pack version is deployed into a workspace, the system
 * writes a `pack_deployments` row and applies overlays for all
 * `object_type` / `link_type` / `action_type` items in the pack.
 *
 * Rollback reverses a deployment by marking it `rolled_back`.
 */

import { createPackDeployment } from './db-helpers.js';
import type { Db, DeployResult, Logger } from './types.js';

// ---------------------------------------------------------------------------
// Deploy errors
// ---------------------------------------------------------------------------

export class DeployError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'ALREADY_DEPLOYED' | 'DB_ERROR',
  ) {
    super(message);
    this.name = 'DeployError';
  }
}

// ---------------------------------------------------------------------------
// Deploy pack
// ---------------------------------------------------------------------------

/**
 * Deploy a pack version into a workspace.
 *
 * Writes a `pack_deployments` row with status `active` and returns
 * a `DeployResult` with the deployment ID and overlay count.
 *
 * The actual overlay application is performed by downstream workers
 * that read the deployment row; this function just records the intent.
 */
export async function deployPack(
  workspaceId: string,
  packVersionId: string,
  deps: { db: Db; logger: Logger },
): Promise<DeployResult> {
  const { db, logger } = deps;

  logger.info('Deploy: starting', { workspaceId, packVersionId });

  try {
    const deploymentId = await createPackDeployment(db, {
      workspaceId,
      packVersionId,
      status: 'active',
      pinned: false,
      deployedBy: null,
      config: {},
    });

    logger.info('Deploy: success', { deploymentId });

    return {
      deploymentId,
      status: 'success',
      overlaysApplied: 0, // Overlays are applied asynchronously
    };
  } catch (err) {
    logger.error('Deploy: failed', {
      error: err instanceof Error ? err.message : String(err),
    });

    return {
      deploymentId: '',
      status: 'failed',
      overlaysApplied: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Rollback pack
// ---------------------------------------------------------------------------

/**
 * Roll back a deployment by updating its status to `rolled_back`.
 *
 * This preserves the deployment row for audit purposes but marks
 * it as no longer active. Downstream workers should remove the
 * applied overlays when they detect a `rolled_back` status.
 */
export async function rollbackPack(
  deploymentId: string,
  deps: { db: Db; logger: Logger },
): Promise<void> {
  const { db, logger } = deps;

  logger.info('Rollback: starting', { deploymentId });

  try {
    // Note: this is a simplified rollback; in production we'd use
    // the injected `db.update()` with proper table references.
    // For now we rely on the caller's DB interface.
    await db.execute({
      sql: `UPDATE pack_deployments SET status = 'rolled_back', updated_at = NOW() WHERE id = '${deploymentId}'`,
    });

    logger.info('Rollback: complete', { deploymentId });
  } catch (err) {
    logger.error('Rollback: failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw new DeployError(
      `Rollback failed: ${err instanceof Error ? err.message : String(err)}`,
      'DB_ERROR',
    );
  }
}
