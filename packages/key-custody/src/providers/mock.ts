import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { KmsProvider } from '../types.js';

const ALGORITHM = 'aes-256-gcm';

/**
 * MockKmsProvider is an in-memory key store for testing.
 * Keys are generated on-the-fly and stored in a Map keyed by keyId.
 */
export class MockKmsProvider implements KmsProvider {
  readonly providerName = 'mock';

  private readonly keys: Map<string, Buffer> = new Map();

  /**
   * Encrypt plaintext using the mock KMS key.
   * In real KMS, this would call the cloud provider.
   * Here we use AES-256-GCM with the stored key.
   */
  async encrypt(plaintext: Buffer, keyId: string): Promise<Buffer> {
    const key = this.getOrCreateKey(keyId);
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Return iv + authTag + encrypted
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt ciphertext using the mock KMS key.
   */
  async decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer> {
    const key = this.getOrCreateKey(keyId);
    const iv = ciphertext.subarray(0, 12);
    const authTag = ciphertext.subarray(12, 28);
    const encrypted = ciphertext.subarray(28);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /**
   * Generate a data encryption key.
   * Returns both plaintext and KMS-encrypted versions.
   */
  async generateDataKey(keyId: string): Promise<{ plaintext: Buffer; encrypted: Buffer }> {
    const plaintext = randomBytes(32); // 256-bit DEK
    const encrypted = await this.encrypt(plaintext, keyId);
    return { plaintext, encrypted };
  }

  /**
   * Inject a known key for testing.
   */
  setKey(keyId: string, key: Buffer): void {
    this.keys.set(keyId, key);
  }

  private getOrCreateKey(keyId: string): Buffer {
    let key = this.keys.get(keyId);
    if (!key) {
      key = randomBytes(32);
      this.keys.set(keyId, key);
    }
    return key;
  }
}
