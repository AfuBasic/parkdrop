import { describe, it, expect } from 'vitest';
import { 
  generateSafeCode, 
  generatePublicPackageId, 
  generatePickupCode, 
  PUBLIC_PACKAGE_ID_PREFIX, 
  PUBLIC_PACKAGE_ID_RANDOM_LENGTH, 
  PICKUP_CODE_LENGTH 
} from './PackageCodeGenerator';

describe('PackageCodeGenerator', () => {
  it('generateSafeCode produces strings of correct length', () => {
    expect(generateSafeCode(5)).toHaveLength(5);
    expect(generateSafeCode(10)).toHaveLength(10);
  });

  it('generateSafeCode only uses the safe alphabet', () => {
    const code = generateSafeCode(100);
    // SAFE_ALPHABET excludes 0, O, 1, I, L
    expect(code).not.toMatch(/[0O1IL]/);
    expect(code).toMatch(/^[2-9A-HJKMNP-Z]+$/);
  });

  it('generatePublicPackageId produces correct prefix and length', () => {
    const publicId = generatePublicPackageId();
    expect(publicId.startsWith(PUBLIC_PACKAGE_ID_PREFIX)).toBe(true);
    expect(publicId).toHaveLength(PUBLIC_PACKAGE_ID_PREFIX.length + PUBLIC_PACKAGE_ID_RANDOM_LENGTH);
  });

  it('generatePickupCode produces string of correct length', () => {
    const pickupCode = generatePickupCode();
    expect(pickupCode).toHaveLength(PICKUP_CODE_LENGTH);
  });

  it('generates reasonably unique values', () => {
    // Weak test for uniqueness, mainly to ensure it's not returning a constant string
    const code1 = generatePickupCode();
    const code2 = generatePickupCode();
    expect(code1).not.toBe(code2);
  });
});
