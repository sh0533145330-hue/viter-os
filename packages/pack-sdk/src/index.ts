/**
 * `@vita/pack-sdk` — Knowledge Pack SDK.
 *
 * Public OSS surface (MIT). Exposes `definePack`, signing, publishing,
 * deployment, overlay merging, vocabulary resolution, dependency
 * resolution, and thin DB helpers for pack lifecycle management.
 */

export { z } from 'zod';

export { definePack } from './define-pack.js';

export {
  signPack,
  verifyPackSignature,
  generatePackKeyPair,
  canonicalizeManifest,
} from './signing.js';

export { resolveDependencies, checkCompatibility } from './dependency.js';

export { applyOverlay, applyPackOverlays } from './overlay.js';

export { VocabularyResolver } from './vocabulary.js';
export type { VocabularyEntry } from './vocabulary.js';

export {
  publishPack,
  PublishError,
  type PublishOptions,
} from './publishing.js';

export {
  deployPack,
  rollbackPack,
  DeployError,
} from './deploy.js';

export {
  parsePackArgs,
  cliPublish,
  cliDeploy,
  type ParsedArgs,
} from './cli.js';

export {
  createPack,
  createPackVersion,
  createPackDeployment,
  type CreatePackParams,
  type CreatePackVersionParams,
  type CreatePackDeploymentParams,
} from './db-helpers.js';

export type {
  Logger,
  Db,
  PackItemKind,
  PackItem,
  PackManifest,
  PackVersionManifest,
  PublishResult,
  DepResolution,
  DeployResult,
  LabelOverride,
} from './types.js';

export const VERSION = '0.0.0';
