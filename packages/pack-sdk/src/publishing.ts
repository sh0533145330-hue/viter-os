/**
 * `@vita/pack-sdk` — publishing flow.
 *
 * The `PublishFlow` orchestrates the end-to-end process of
 * validating, evaluating, signing, and publishing a pack version.
 * It delegates to injected dependencies (Db, Logger) and the
 * signing module.
 *
 * Flow: validate → eval → sign → publish
 */

import { canonicalizeManifest, signPack } from './signing.js';
import type {
  Db,
  Logger,
  PackManifest,
  PublishResult,
} from './types.js';
import { createPack, createPackVersion } from './db-helpers.js';

// ---------------------------------------------------------------------------
// Publish options
// ---------------------------------------------------------------------------

export interface PublishOptions {
  /** The manifest to publish. */
  manifest: PackManifest;
  /** Private key (DER PKCS#8) for signing. */
  privateKey: Buffer;
  /** Injected DB handle. */
  db: Db;
  /** Injected logger. */
  logger: Logger;
  /** Workspace scope (for scoped packs). */
  scope?: string | undefined;
  /** Scope ID. */
  scopeId?: string | undefined;
  /** If true, skip signing. */
  skipSign?: boolean | undefined;
}

// ---------------------------------------------------------------------------
// Publish errors
// ---------------------------------------------------------------------------

export class PublishError extends Error {
  constructor(
    message: string,
    public readonly code: 'VALIDATION' | 'SIGNING' | 'DB_ERROR',
  ) {
    super(message);
    this.name = 'PublishError';
  }
}

// ---------------------------------------------------------------------------
// Publish flow
// ---------------------------------------------------------------------------

/**
 * Run the full publish flow:
 * 1. Validate the manifest
 * 2. Eval (stub — real evals are EP-30 v2; currently a no-op)
 * 3. Sign
 * 4. Persist (write packs row → pack_versions row)
 */
export async function publishPack(
  options: PublishOptions,
): Promise<PublishResult> {
  const { manifest, privateKey, db, logger, scope, scopeId, skipSign } =
    options;

  logger.info('PublishFlow: starting', { packKey: manifest.key });

  // ---- 1. Validate ----
  logger.info('PublishFlow: validating manifest');
  if (!manifest.key || !manifest.name || !manifest.items) {
    throw new PublishError('Invalid manifest: missing required fields', 'VALIDATION');
  }

  // ---- 2. Eval (stub) ----
  logger.info('PublishFlow: running evals (stub — no eval suites configured)');

  // ---- 3. Sign ----
  let signature: string | undefined;
  let signedManifest: string | undefined;

  if (!skipSign) {
    logger.info('PublishFlow: signing manifest');
    try {
      const result = await signPack(manifest, privateKey);
      signature = result.signature.toString('base64');
      signedManifest = result.signedManifest;
    } catch (err) {
      throw new PublishError(
        `Signing failed: ${err instanceof Error ? err.message : String(err)}`,
        'SIGNING',
      );
    }
  } else {
    signedManifest = canonicalizeManifest(manifest);
  }

  // ---- 4. Persist ----
  logger.info('PublishFlow: persisting pack');

  try {
    // Create the pack row
    const packId = await createPack(db, {
      scope: scope ?? 'public',
      scopeId: scopeId ?? null,
      key: manifest.key,
      name: manifest.name,
      description: manifest.description,
      vertical: manifest.vertical,
      vendor: manifest.vendor,
      license: manifest.license,
    });

    // Create the pack version row
    const version = manifest.version ?? '0.1.0';
    const packVersionId = await createPackVersion(db, {
      packId,
      version,
      manifest: JSON.parse(signedManifest!) as Record<string, unknown>,
      signature: signature ?? null,
      changelog: undefined,
    });

    logger.info('PublishFlow: complete', {
      packId,
      packVersionId,
      version,
    });

    return {
      packId,
      packVersionId,
      version,
      signed: !skipSign,
    };
  } catch (err) {
    throw new PublishError(
      `Database error: ${err instanceof Error ? err.message : String(err)}`,
      'DB_ERROR',
    );
  }
}
