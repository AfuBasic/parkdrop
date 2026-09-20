import { describe, it, expect } from 'vitest';
import { normalizePhone, formatPhoneForDisplay } from './phoneNormalizer';

describe('phoneNormalizer', () => {
  describe('normalizePhone', () => {
    it('normalizes valid nigerian phone numbers', () => {
      expect(normalizePhone('08031234567')).toBe('+2348031234567');
      expect(normalizePhone('8031234567')).toBe('+2348031234567');
      expect(normalizePhone('2348031234567')).toBe('+2348031234567');
      expect(normalizePhone('+2348031234567')).toBe('+2348031234567');

      expect(normalizePhone('0803 123 4567')).toBe('+2348031234567');
      expect(normalizePhone('0803-123-4567')).toBe('+2348031234567');
      expect(normalizePhone('+234 803 123 4567')).toBe('+2348031234567');
    });

    it('rejects invalid phone numbers', () => {
      expect(normalizePhone('123')).toBeNull();
      expect(normalizePhone('abcde')).toBeNull();
      expect(normalizePhone('00000000000')).toBeNull();
      expect(normalizePhone('08031234567890123')).toBeNull();
      expect(normalizePhone('080')).toBeNull();
    });
  });

  describe('formatPhoneForDisplay', () => {
    it('formats normalized phone numbers', () => {
      expect(formatPhoneForDisplay('+2348031234567')).toBe('0803 123 4567');
      expect(formatPhoneForDisplay('+15551234567')).toBe('+15551234567');
    });
  });
});
