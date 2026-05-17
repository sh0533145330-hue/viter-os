import { z } from 'zod';

// ── KMS Provider interface ────────────────────────────────────

export interface KmsProvider {
  /** Encrypt plaintext with the given key ID. Returns ciphertext. */
  encrypt(plaintext: Buffer, keyId: string): Promise<Buffer>;
  /** Decrypt ciphertext with the given key ID. Returns plaintext. */
  decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer>;
  /** Generate a new data encryption key. */
  generateDataKey(keyId: string): Promise<{ plaintext: Buffer; encrypted: Buffer }>;
  /** Get metadata about the provider */
  readonly providerName: string;
}

// ── Envelope encryption ───────────────────────────────────────

export const envelopeEncryptResultSchema = z.object({
  /** AES-256-GCM encrypted data (includes auth tag) */
  encryptedData: z.string(),
  /** KMS-encrypted DEK */
  encryptedKey: z.string(),
  /** KMS key reference */
  keyRef: z.string(),
  /** IV used for AES-GCM (hex) */
  iv: z.string(),
  /** Authentication tag (hex) */
  authTag: z.string(),
  /** Provider that was used */
  provider: z.string(),
});
export type EnvelopeEncryptResult = z.infer<typeof envelopeEncryptResultSchema>;

// ── Key rotation ──────────────────────────────────────────────

export const rotationConfigSchema = z.object({
  /** Rotate keys older than this many days */
  maxAgeDays: z.number().int().positive().default(90),
  /** Check for rotation every N hours */
  checkIntervalHours: z.number().int().positive().default(24),
  /** Auto-rotate without manual approval */
  autoRotate: z.boolean().default(false),
});
export type RotationConfig = z.infer<typeof rotationConfigSchema>;

export const keyStatusSchema = z.enum(['active', 'rotating', 'retired']);
export type KeyStatus = z.infer<typeof keyStatusSchema>;

// ── Key metadata ──────────────────────────────────────────────

export const keyMetadataSchema = z.object({
  id: z.string().uuid(),
  scope: z.enum(['platform', 'agency', 'workspace']),
  scopeId: z.string().uuid().nullable(),
  kmsProvider: z.string(),
  keyRef: z.string(),
  alias: z.string().nullable(),
  status: keyStatusSchema,
  rotatedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type KeyMetadata = z.infer<typeof keyMetadataSchema>;
