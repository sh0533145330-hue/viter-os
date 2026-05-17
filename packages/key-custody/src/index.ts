export { envelopeEncrypt, envelopeDecrypt } from './envelope.js';
export { KeyRotationScheduler } from './rotation.js';
export { MockKmsProvider } from './providers/mock.js';
export { AwsKmsProvider } from './providers/aws-kms.js';
export { GcpKmsProvider } from './providers/gcp-kms.js';
export { VaultProvider } from './providers/vault.js';

export type {
  KmsProvider,
  EnvelopeEncryptResult,
  RotationConfig,
  KeyStatus,
  KeyMetadata,
} from './types.js';

export {
  envelopeEncryptResultSchema,
  rotationConfigSchema,
  keyStatusSchema,
  keyMetadataSchema,
} from './types.js';

export const VERSION = '0.0.0';
