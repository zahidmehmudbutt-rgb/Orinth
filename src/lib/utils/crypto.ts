/**
 * Encryption utility using Web Crypto API (AES-GCM with PBKDF2 key derivation).
 *
 * - If VITE_ENCRYPTION_KEY is not set, values pass through as plaintext (dev fallback).
 * - Encrypted format: base64( IV [12 bytes] + ciphertext )
 */

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY as string | undefined;

// Fixed salt for PBKDF2 derivation (not secret, just needs to be consistent)
const PBKDF2_SALT = new TextEncoder().encode("school-smart-pakistan-salt");
const PBKDF2_ITERATIONS = 100_000;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: PBKDF2_SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a plaintext string using AES-GCM.
 * Returns a base64 string containing IV + ciphertext.
 * Falls back to returning plaintext if no encryption key is configured.
 */
export async function encryptValue(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;
  if (!ENCRYPTION_KEY) return plaintext;

  const key = await deriveKey(ENCRYPTION_KEY);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  // Combine IV + ciphertext into a single buffer
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Encode as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64-encoded AES-GCM ciphertext (IV + ciphertext).
 * Falls back to returning the input as-is if no encryption key is configured
 * or if decryption fails (e.g. the value was stored as plaintext).
 */
export async function decryptValue(encrypted: string): Promise<string> {
  if (!encrypted) return encrypted;
  if (!ENCRYPTION_KEY) return encrypted;

  try {
    // Decode base64 to bytes
    const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

    // Sanity check: must be at least IV_LENGTH + 1 byte of ciphertext + 16 byte auth tag
    if (combined.length < IV_LENGTH + 17) {
      // Too short to be a valid encrypted value; return as-is (likely plaintext)
      return encrypted;
    }

    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const key = await deriveKey(ENCRYPTION_KEY);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // Decryption failed - likely a plaintext value stored before encryption was enabled
    return encrypted;
  }
}
