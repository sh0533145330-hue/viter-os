/**
 * `@vita/pack-sdk` — definePack entry point.
 *
 * Every seed pack and dynamically authored pack calls `definePack`
 * to validate the manifest shape and return a strongly-typed
 * `PackManifest`. This is the single source of truth for pack
 * authoring.
 */

import type { z } from 'zod';
import { PackManifestSchema, type PackManifest } from './types.js';

export type DefinePackInput = z.input<typeof PackManifestSchema>;

/**
 * Validate and return a typed `PackManifest`.
 *
 * @throws {ZodError} if the manifest fails structural validation.
 */
export function definePack(manifest: DefinePackInput): PackManifest {
  return PackManifestSchema.parse(manifest);
}
