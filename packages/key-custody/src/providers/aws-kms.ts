import type { KmsProvider } from '../types.js';

/**
 * Stub for AWS KMS provider.
 * Replace with actual AWS SDK KMS integration.
 */
export class AwsKmsProvider implements KmsProvider {
  readonly providerName = 'aws-kms';

  async encrypt(_plaintext: Buffer, _keyId: string): Promise<Buffer> {
    throw new Error('AWS KMS provider not implemented. Use @vita/key-custody/providers/mock for testing.');
  }

  async decrypt(_ciphertext: Buffer, _keyId: string): Promise<Buffer> {
    throw new Error('AWS KMS provider not implemented.');
  }

  async generateDataKey(_keyId: string): Promise<{ plaintext: Buffer; encrypted: Buffer }> {
    throw new Error('AWS KMS provider not implemented.');
  }
}
