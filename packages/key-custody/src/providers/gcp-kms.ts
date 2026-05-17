import type { KmsProvider } from '../types.js';

/**
 * Stub for GCP KMS provider.
 * Replace with actual Google Cloud KMS integration.
 */
export class GcpKmsProvider implements KmsProvider {
  readonly providerName = 'gcp-kms';

  async encrypt(_plaintext: Buffer, _keyId: string): Promise<Buffer> {
    throw new Error('GCP KMS provider not implemented. Use @vita/key-custody/providers/mock for testing.');
  }

  async decrypt(_ciphertext: Buffer, _keyId: string): Promise<Buffer> {
    throw new Error('GCP KMS provider not implemented.');
  }

  async generateDataKey(_keyId: string): Promise<{ plaintext: Buffer; encrypted: Buffer }> {
    throw new Error('GCP KMS provider not implemented.');
  }
}
