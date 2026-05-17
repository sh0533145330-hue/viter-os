/**
 * `@vita/pack-sdk` — cryptographic signing of pack manifests.
 *
 * Uses Ed25519 via `node:crypto`. The manifest is canonical JSON-
 * serialized before signing so that the signature is deterministic
 * for a given manifest + keypair.
 *
 * For Ed25519 we use `crypto.sign(null, ...)` and `crypto.verify(null, ...)`
 * because Ed25519 uses its own built-in hashing (no external digest needed).
 */

import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';
import type { PackManifest } from './types.js';

// ---------------------------------------------------------------------------
// Key generation helpers
// ---------------------------------------------------------------------------

/**
 * Generate an Ed25519 key pair synchronously.
 * Returns DER-encoded SPKI (public) and PKCS#8 (private) for
 * reproducible export/import.
 */
export function generatePackKeyPair(): { publicKey: Buffer; privateKey: Buffer } {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });
  return { publicKey, privateKey };
}

/**
 * Create a KeyObject from a DER-encoded SPKI public key buffer.
 */
function importPublicKey(der: Buffer): KeyObject {
  return createPublicKey({ key: der, format: 'der', type: 'spki' });
}

/**
 * Create a KeyObject from a DER-encoded PKCS#8 private key buffer.
 */
function importPrivateKey(der: Buffer): KeyObject {
  return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
}

// ---------------------------------------------------------------------------
// Canonical JSON serialization
// ---------------------------------------------------------------------------

/**
 * Serialize a PackManifest to a deterministic JSON string (sorted keys).
 */
export function canonicalizeManifest(manifest: PackManifest): string {
  return JSON.stringify(manifest, Object.keys(manifest).sort());
}

// ---------------------------------------------------------------------------
// Sign
// ---------------------------------------------------------------------------

/**
 * Sign a `PackManifest` with an Ed25519 private key (DER-encoded PKCS#8).
 *
 * Uses `crypto.sign(null, data, privateKey)` — Ed25519 signatures
 * are natively 64 bytes and do not use SHA-256 externally.
 */
export async function signPack(
  manifest: PackManifest,
  privateKeyDer: Buffer,
): Promise<{ signature: Buffer; signedManifest: string }> {
  const payload = canonicalizeManifest(manifest);
  const privateKey = importPrivateKey(privateKeyDer);
  const signature = sign(null, Buffer.from(payload, 'utf-8'), privateKey);
  return { signature, signedManifest: payload };
}

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------

/**
 * Verify a pack manifest signature against an Ed25519 public key (DER-encoded SPKI).
 */
export async function verifyPackSignature(
  manifest: PackManifest,
  signature: Buffer,
  publicKeyDer: Buffer,
): Promise<boolean> {
  const payload = canonicalizeManifest(manifest);
  const publicKey = importPublicKey(publicKeyDer);
  return verify(null, Buffer.from(payload, 'utf-8'), publicKey, signature);
}
