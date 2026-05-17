import { describe, expect, it } from 'vitest';
import { envelopeEncrypt, envelopeDecrypt } from '../envelope.js';
import { MockKmsProvider } from '../providers/mock.js';

describe('envelopeEncrypt / envelopeDecrypt', () => {
  const provider = new MockKmsProvider();
  const keyId = 'test-key-1';

  it('encrypts and decrypts a string round-trip', async () => {
    const plaintext = 'Hello, secure world!';
    const envelope = await envelopeEncrypt(plaintext, keyId, provider);
    const decrypted = await envelopeDecrypt(envelope, provider);
    expect(decrypted.toString('utf-8')).toBe(plaintext);
  });

  it('encrypts and decrypts binary data round-trip', async () => {
    const plaintext = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
    const envelope = await envelopeEncrypt(plaintext, keyId, provider);
    const decrypted = await envelopeDecrypt(envelope, provider);
    expect(decrypted).toEqual(plaintext);
  });

  it('produces different ciphertexts for same plaintext', async () => {
    const plaintext = 'test data';
    const e1 = await envelopeEncrypt(plaintext, keyId, provider);
    const e2 = await envelopeEncrypt(plaintext, keyId, provider);
    // Different IVs and DEKs should produce different ciphertexts
    expect(e1.encryptedData).not.toBe(e2.encryptedData);
    expect(e1.iv).not.toBe(e2.iv);
  });

  it('includes all metadata fields', async () => {
    const envelope = await envelopeEncrypt('data', keyId, provider);
    expect(envelope.encryptedData).toBeTruthy();
    expect(envelope.encryptedKey).toBeTruthy();
    expect(envelope.keyRef).toBe(keyId);
    expect(envelope.iv).toBeTruthy();
    expect(envelope.authTag).toBeTruthy();
    expect(envelope.provider).toBe('mock');
  });

  it('decrypt fails with wrong auth tag (tampering detection)', async () => {
    const envelope = await envelopeEncrypt('secret', keyId, provider);
    // Tamper with auth tag
    const tampered = { ...envelope, authTag: 'aa'.repeat(16) };
    await expect(envelopeDecrypt(tampered, provider)).rejects.toThrow();
  });

  it('decrypt fails with wrong encrypted key', async () => {
    const envelope = await envelopeEncrypt('secret', keyId, provider);
    const tampered = { ...envelope, encryptedKey: Buffer.from('bad').toString('base64') };
    await expect(envelopeDecrypt(tampered, provider)).rejects.toThrow();
  });

  it('handles empty plaintext', async () => {
    const envelope = await envelopeEncrypt('', keyId, provider);
    const decrypted = await envelopeDecrypt(envelope, provider);
    expect(decrypted.toString('utf-8')).toBe('');
  });

  it('handles large plaintext (~1MB)', async () => {
    const plaintext = 'x'.repeat(1024 * 1024);
    const envelope = await envelopeEncrypt(plaintext, keyId, provider);
    const decrypted = await envelopeDecrypt(envelope, provider);
    expect(decrypted.toString('utf-8')).toBe(plaintext);
  });
});

describe('MockKmsProvider', () => {
  it('encrypts and decrypts data directly', async () => {
    const p = new MockKmsProvider();
    const plaintext = Buffer.from('test');
    const encrypted = await p.encrypt(plaintext, 'key1');
    const decrypted = await p.decrypt(encrypted, 'key1');
    expect(decrypted).toEqual(plaintext);
  });

  it('generates data key', async () => {
    const p = new MockKmsProvider();
    const { plaintext, encrypted } = await p.generateDataKey('key1');
    expect(plaintext.length).toBe(32);
    expect(encrypted.length).toBeGreaterThan(32);
    // Decrypt should recover the DEK
    const recovered = await p.decrypt(encrypted, 'key1');
    expect(recovered).toEqual(plaintext);
  });

  it('different keyIds use different keys', async () => {
    const p = new MockKmsProvider();
    const encrypted1 = await p.encrypt(Buffer.from('data'), 'keyA');
    const encrypted2 = await p.encrypt(Buffer.from('data'), 'keyB');
    // Encrypting the same data with different keys produces different ciphertexts
    // (but we can't easily assert this since IV also differs, so just verify decryption works)
    const d1 = await p.decrypt(encrypted1, 'keyA');
    const d2 = await p.decrypt(encrypted2, 'keyB');
    expect(d1.toString()).toBe('data');
    expect(d2.toString()).toBe('data');

    // Cross-key decryption should fail
    await expect(p.decrypt(encrypted1, 'keyB')).rejects.toThrow();
  });

  it('setKey allows pre-sharing keys', async () => {
    const p = new MockKmsProvider();
    const knownKey = Buffer.alloc(32, 0x42);
    p.setKey('shared', knownKey);

    const encrypted = await p.encrypt(Buffer.from('hello'), 'shared');

    // Create another provider with same key
    const p2 = new MockKmsProvider();
    p2.setKey('shared', knownKey);
    const decrypted = await p2.decrypt(encrypted, 'shared');
    expect(decrypted.toString()).toBe('hello');
  });

  it('reports provider name', () => {
    const p = new MockKmsProvider();
    expect(p.providerName).toBe('mock');
  });
});
