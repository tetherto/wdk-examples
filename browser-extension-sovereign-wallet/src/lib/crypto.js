/**
 * WDK Extension - Cryptography Utilities
 * 
 * AES-256-GCM encryption for seed phrase vault storage.
 * Uses the Web Crypto API (available in extension service workers).
 */

/**
 * Derive a CryptoKey from a password using PBKDF2
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: 310000, // OWASP recommended minimum for PBKDF2-SHA256
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext with AES-256-GCM
 */
export async function encrypt(plaintext, password, salt, iv) {
  const encoder = new TextEncoder();
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    encoder.encode(plaintext)
  );

  // Return as base64 string for storage
  return btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
}

/**
 * Decrypt ciphertext with AES-256-GCM
 */
export async function decrypt(encryptedBase64, password, salt, iv) {
  const decoder = new TextDecoder();
  const key = await deriveKey(password, salt);

  // Decode from base64
  const ciphertext = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    ciphertext
  );

  return decoder.decode(plaintext);
}

/**
 * Generate a cryptographically secure random hex string
 */
export function generateId(bytes = 16) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a string with SHA-256 (for non-sensitive integrity checks)
 */
export async function sha256(str) {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
