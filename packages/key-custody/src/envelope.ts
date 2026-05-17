import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { EnvelopeEncryptResult, KmsProvider } from './types.js';

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt plaintext using envelope encryption:
 * 1. Generate a random DEK (AES-256-GCM key)
 * 2. Encrypt the plaintext with the DEK
 * 3. Encrypt (wrap) the DEK with the KMS key
 *
 * Returns encrypted data, wrapped key, and metadata.
 */
export async function envelopeEncrypt(
  plaintext: Buffer | string,
  keyId: string,
  provider: KmsProvider,
): Promise<EnvelopeEncryptResult> {
  const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf-8') : plaintext;

  // Generate a random DEK
  const dek = randomBytes(32); // 256-bit
  const iv = randomBytes(12); // 96-bit for GCM

  // Encrypt data with DEK
  const cipher = createCipheriv(ALGORITHM, dek, iv);
  const encryptedChunks: Buffer[] = [cipher.update(data), cipher.final()];
  const encrypted = Buffer.concat(encryptedChunks);
  const authTag = cipher.getAuthTag();

  // Wrap DEK with KMS
  const encryptedDek = await provider.encrypt(dek, keyId);

  return {
    encryptedData: encrypted.toString('base64'),
    encryptedKey: encryptedDek.toString('base64'),
    keyRef: keyId,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    provider: provider.providerName,
  };
}

/**
 * Decrypt data that was encrypted with envelopeEncrypt:
 * 1. Decrypt (unwrap) the DEK using the KMS key
 * 2. Decrypt the data with the DEK
 */
export async function envelopeDecrypt(
  envelope: EnvelopeEncryptResult,
  provider: KmsProvider,
): Promise<Buffer> {
  const encryptedDek = Buffer.from(envelope.encryptedKey, 'base64');
  const iv = Buffer.from(envelope.iv, 'hex');
  const authTag = Buffer.from(envelope.authTag, 'hex');
  const encryptedData = Buffer.from(envelope.encryptedData, 'base64');

  // Unwrap DEK
  const dek = await provider.decrypt(encryptedDek, envelope.keyRef);

  // Decrypt data with DEK
  const decipher = createDecipheriv(ALGORITHM, dek, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

  return decrypted;
}
