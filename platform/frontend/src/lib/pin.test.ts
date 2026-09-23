import { describe, it, expect } from 'vitest';
import { hashPin, generateSalt, verifyPin } from './pin';

describe('pin.ts', () => {
  it('should generate a valid base64 salt', () => {
    const salt = generateSalt();
    expect(typeof salt).toBe('string');
    expect(salt.length).toBeGreaterThan(0);
  });

  it('should hash and verify a correct PIN securely', async () => {
    const pin = '1234';
    const salt = generateSalt();
    
    const hash = await hashPin(pin, salt);
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(pin);

    const isValid = await verifyPin(pin, hash, salt);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect PIN', async () => {
    const pin = '1234';
    const salt = generateSalt();
    const hash = await hashPin(pin, salt);

    const isValid = await verifyPin('4321', hash, salt);
    expect(isValid).toBe(false);
  });
});
