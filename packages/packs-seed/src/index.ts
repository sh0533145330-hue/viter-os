/**
 * `@vita/packs-seed` — stub seed Knowledge Packs.
 *
 * Each named export is a `PackManifest` produced by `definePack`,
 * covering the foundational ObjectTypes for its vertical.
 */

export { generalFoundationPack } from './general-foundation.js';
export { cpaPack } from './cpa.js';
export { propertyMgmtPack } from './property-mgmt.js';
export { assetMgmtPack } from './asset-mgmt.js';
export { revopsPack } from './revops.js';

import type { PackManifest } from '@vita/pack-sdk';
import { generalFoundationPack } from './general-foundation.js';
import { cpaPack } from './cpa.js';
import { propertyMgmtPack } from './property-mgmt.js';
import { assetMgmtPack } from './asset-mgmt.js';
import { revopsPack } from './revops.js';

export const allSeedPacks: readonly PackManifest[] = [
  generalFoundationPack,
  cpaPack,
  propertyMgmtPack,
  assetMgmtPack,
  revopsPack,
] as const;
