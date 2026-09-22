// The ParkDrop ambiguity-safe alphabet, excluding 0, O, 1, I, L
const SAFE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export const PUBLIC_PACKAGE_ID_PREFIX = 'PD-';
export const PUBLIC_PACKAGE_ID_RANDOM_LENGTH = 5;
export const PICKUP_CODE_LENGTH = 6;

/**
 * Generate a cryptographically secure random string using the safe alphabet.
 */
export function generateSafeCode(length: number): string {
  let result = '';
  // Fallback to Math.random if crypto is not available (e.g., in some test environments),
  // but strictly use crypto if available.
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += SAFE_ALPHABET[randomValues[i] % SAFE_ALPHABET.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += SAFE_ALPHABET[Math.floor(Math.random() * SAFE_ALPHABET.length)];
    }
  }
  return result;
}

export function generatePublicPackageId(): string {
  return `${PUBLIC_PACKAGE_ID_PREFIX}${generateSafeCode(PUBLIC_PACKAGE_ID_RANDOM_LENGTH)}`;
}

export function generatePickupCode(): string {
  return generateSafeCode(PICKUP_CODE_LENGTH);
}
