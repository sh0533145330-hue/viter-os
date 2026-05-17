import { describe, expect, it } from 'vitest';
import {
  signPack,
  verifyPackSignature,
  generatePackKeyPair,
} from '../signing.js';
import type { PackManifest } from '../types.js';

describe('signing — round-trip', () => {
  const manifest: PackManifest = {
    key: 'test-pack',
    name: 'Test Pack',
    description: 'A test pack',
    vertical: 'test',
    vendor: 'VitaOS',
    license: 'MIT',
    dependencies: {},
    items: [
      {
        kind: 'object_type',
        key: 'test_thing',
        name: 'Test Thing',
        definition: { properties: { name: { type: 'string' } } },
      },
    ],
  };

  it('signs and verifies successfully', async () => {
    const { publicKey, privateKey } = generatePackKeyPair();
    const { signature } = await signPack(manifest, privateKey);

    expect(signature).toBeInstanceOf(Buffer);
    expect(signature.length).toBeGreaterThan(0);

    const valid = await verifyPackSignature(manifest, signature, publicKey);
    expect(valid).toBe(true);
  });

  it('fails verification with wrong public key', async () => {
    const { privateKey } = generatePackKeyPair();
    const { publicKey: wrongKey } = generatePackKeyPair();
    const { signature } = await signPack(manifest, privateKey);

    const valid = await verifyPackSignature(manifest, signature, wrongKey);
    expect(valid).toBe(false);
  });

  it('fails verification with tampered manifest', async () => {
    const { publicKey, privateKey } = generatePackKeyPair();
    const { signature } = await signPack(manifest, privateKey);

    const tampered: PackManifest = {
      ...manifest,
      name: 'Tampered Pack',
    };

    const valid = await verifyPackSignature(tampered, signature, publicKey);
    expect(valid).toBe(false);
  });

  it('produces deterministic signatures for the same manifest+key', async () => {
    const { privateKey } = generatePackKeyPair();
    const sig1 = await signPack(manifest, privateKey);
    const sig2 = await signPack(manifest, privateKey);

    expect(sig1.signature.toString('base64')).toBe(
      sig2.signature.toString('base64'),
    );
  });

  it('produces different signatures for different manifests', async () => {
    const { privateKey } = generatePackKeyPair();
    const manifestB: PackManifest = {
      ...manifest,
      key: 'other-pack',
    };

    const sig1 = await signPack(manifest, privateKey);
    const sig2 = await signPack(manifestB, privateKey);

    expect(sig1.signature.toString('base64')).not.toBe(
      sig2.signature.toString('base64'),
    );
  });
});
