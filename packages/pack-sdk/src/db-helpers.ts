/**
 * `@vita/pack-sdk` — thin DB helper wrappers.
 *
 * These accept an injected `Db` interface and return results.
 * They are intentionally thin so consumers can swap in their
 * own implementations without changing the SDK surface.
 *
 * All functions return the UUID of the created row.
 */

import type { Db } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid(): string {
  // Simple RFC 9562 v4 UUID generator (no external dep)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// createPack
// ---------------------------------------------------------------------------

export interface CreatePackParams {
  scope: string;
  scopeId: string | null;
  key: string;
  name: string;
  description: string;
  vertical: string;
  vendor: string;
  license: string;
}

/**
 * Create a `packs` row via the injected Db interface.
 * Returns the new pack ID.
 */
export async function createPack(
  db: Db,
  params: CreatePackParams,
): Promise<string> {
  const id = uuid();
  const now = nowISO();

  await db.insert({
    table: 'packs',
  } as unknown as Record<string, unknown>).values({
    id,
    scope: params.scope,
    scopeId: params.scopeId,
    key: params.key,
    name: params.name,
    description: params.description,
    vertical: params.vertical,
    vendor: params.vendor,
    license: params.license,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

// ---------------------------------------------------------------------------
// createPackVersion
// ---------------------------------------------------------------------------

export interface CreatePackVersionParams {
  packId: string;
  version: string;
  manifest: Record<string, unknown>;
  signature: string | null;
  changelog?: string | undefined;
}

/**
 * Create a `pack_versions` row via the injected Db interface.
 * Returns the new pack version ID.
 */
export async function createPackVersion(
  db: Db,
  params: CreatePackVersionParams,
): Promise<string> {
  const id = uuid();
  const now = nowISO();

  await db.insert({
    table: 'pack_versions',
  } as unknown as Record<string, unknown>).values({
    id,
    packId: params.packId,
    version: params.version,
    manifest: params.manifest,
    signature: params.signature,
    changelog: params.changelog ?? null,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

// ---------------------------------------------------------------------------
// createPackDeployment
// ---------------------------------------------------------------------------

export interface CreatePackDeploymentParams {
  workspaceId: string;
  packVersionId: string;
  status: string;
  pinned: boolean;
  deployedBy: string | null;
  config: Record<string, unknown>;
}

/**
 * Create a `pack_deployments` row via the injected Db interface.
 * Returns the new deployment ID.
 */
export async function createPackDeployment(
  db: Db,
  params: CreatePackDeploymentParams,
): Promise<string> {
  const id = uuid();
  const now = nowISO();

  await db.insert({
    table: 'pack_deployments',
  } as unknown as Record<string, unknown>).values({
    id,
    workspaceId: params.workspaceId,
    packVersionId: params.packVersionId,
    status: params.status,
    pinned: params.pinned,
    deployedBy: params.deployedBy,
    deployedAt: now,
    config: params.config,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}
