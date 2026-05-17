import type { KmsProvider } from '../types.js';

/**
 * Stub for HashiCorp Vault transit engine provider.
 * Replace with actual Vault client integration.
 */
export class VaultProvider implements KmsProvider {
  readonly providerName = 'vault';

  async encrypt(_plaintext: Buffer, _keyId: string): Promise<Buffer> {
    throw new Error('Vault provider not implemented. Use @vita/key-custody/providers/mock for testing.');
  }

  async decrypt(_ciphertext: Buffer, _keyId: string): Promise<Buffer> {
    throw new Error('Vault provider not implemented.');
  }

  async generateDataKey(_keyId: string): Promise<{ plaintext: Buffer; encrypted: Buffer }> {
    throw new Error('Vault provider not implemented.');
  }
}
