/**
 * Secure PIN hashing for offline device unlock using Web Crypto API.
 */

const ITERATIONS = 100000;
const HASH_LENGTH = 32;

/**
 * Generates a random base64 salt.
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Hashes a PIN using PBKDF2 with SHA-256.
 */
export async function hashPin(pin: string, base64Salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBuffer = Uint8Array.from(atob(base64Salt), c => c.charCodeAt(0));

  const keyBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  return btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));
}

/**
 * Verifies a PIN against a stored hash and salt.
 */
export async function verifyPin(pin: string, storedHash: string, base64Salt: string): Promise<boolean> {
  const hash = await hashPin(pin, base64Salt);
  return hash === storedHash;
}
