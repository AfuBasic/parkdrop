import { describe, it, expect } from 'vitest';
import {
  renderCustomerSms,
  renderArrivalSms,
  isGsm7,
  normaliseForSms,
  combinedNameBudget,
  SMS_MAX_CHARS,
} from './smsTemplate';
import {
  validateNigerianMobile,
  toCanonicalPhone,
  formatPhoneDisplay,
  toE164,
  lastFourDigits,
} from '@/features/auth/lib/phone';

describe('smsTemplate', () => {
  describe('renderCustomerSms', () => {
    it('renders the standard customer SMS with contact phone', () => {
      const res = renderCustomerSms({
        pickupPointName: 'Chima Parcel Services',
        parkName: 'Peace Park',
        phone: '08031234567',
        code: '4821',
      });

      expect(res.text).toBe(
        'Your package is at Chima Parcel Services, Peace Park.\nShow code 4821 at pickup.\nCall: 08031234567\nParkDrop'
      );
      expect(res.valid).toBe(true);
      expect(res.length).toBeLessThanOrEqual(SMS_MAX_CHARS);
    });

    it('omits Call line entirely when phone is null or empty', () => {
      const res = renderCustomerSms({
        pickupPointName: 'Chima Parcel Services',
        parkName: 'Peace Park',
        code: '4821',
      });

      expect(res.text).toBe(
        'Your package is at Chima Parcel Services, Peace Park.\nShow code 4821 at pickup.\nParkDrop'
      );
      expect(res.text).not.toContain('Call:');
      expect(res.valid).toBe(true);
    });

    it('formats 234 prefix to 0803 in Call line', () => {
      const res = renderCustomerSms({
        pickupPointName: 'Shop',
        parkName: 'Park',
        phone: '2348031234567',
        code: '1234',
      });

      expect(res.text).toContain('Call: 08031234567');
    });

    it('enforces hard 130 character limit', () => {
      // Exactly at budget
      const longPoint = 'A'.repeat(50);
      const longPark = 'B'.repeat(50);
      const res = renderCustomerSms({
        pickupPointName: longPoint,
        parkName: longPark,
        phone: '08031234567',
        code: '1234567', // 7 chars worst case
      });

      // 100 chars names + overhead will be > 130
      expect(res.length).toBeGreaterThan(SMS_MAX_CHARS);
      expect(res.valid).toBe(false);
      expect(res.reason).toBe('TOO_LONG');
    });

    it('rejects empty pickup point and park names', () => {
      const res = renderCustomerSms({
        pickupPointName: '',
        parkName: '',
        code: '1234',
        phone: '08031234567',
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toBe('EMPTY_NAME');
    });

    it('normalises accents and combining marks for GSM-7', () => {
      const res = renderCustomerSms({
        pickupPointName: 'Ṣèyí Store · Counter 1',
        parkName: 'Oshodi “Central” Park',
        phone: '08031234567',
        code: '4821',
      });

      expect(res.valid).toBe(true);
      expect(res.text).toContain('Seyi Store - Counter 1');
      expect(res.text).toContain('Oshodi "Central" Park');
      expect(isGsm7(res.text)).toBe(true);
    });

    it('golden test: renderCustomerSms text === renderArrivalSms text', () => {
      const params = {
        pickupPointName: 'Express Drop Hub',
        parkName: 'Ikeja Terminal 2',
        pickupCode: '8910',
        phone: '08031234567',
      };

      const unifiedResult = renderCustomerSms({
        pickupPointName: params.pickupPointName,
        parkName: params.parkName,
        code: params.pickupCode,
        phone: params.phone,
      });

      const legacyText = renderArrivalSms(params);

      expect(unifiedResult.text).toBe(legacyText);
      expect(unifiedResult.length).toBeLessThanOrEqual(SMS_MAX_CHARS);
    });
  });

  describe('normaliseForSms', () => {
    it('folds typographic quotes, dashes, and ellipsis', () => {
      expect(normaliseForSms('“Hello’ — world…')).toBe('"Hello\' - world...');
    });

    it('folds middle dot and bullet point to dash', () => {
      expect(normaliseForSms('Shop · Unit • Gate')).toBe('Shop - Unit - Gate');
    });

    it('handles null and undefined gracefully', () => {
      expect(normaliseForSms(null)).toBe('');
      expect(normaliseForSms(undefined)).toBe('');
    });
  });

  describe('combinedNameBudget', () => {
    it('provides a positive budget for names against worst-case 7-char code and 11-digit phone', () => {
      const budget = combinedNameBudget();
      expect(budget).toBeGreaterThan(40);
      expect(budget).toBeLessThan(75);
    });
  });
});

describe('phone helpers', () => {
  describe('validateNigerianMobile', () => {
    it('validates 11-digit local format with 080, 081, 070, 090, 091', () => {
      expect(validateNigerianMobile('0803 123 4567').valid).toBe(true);
      expect(validateNigerianMobile('08031234567').valid).toBe(true);
      expect(validateNigerianMobile('07011223344').valid).toBe(true);
      expect(validateNigerianMobile('09099887766').valid).toBe(true);
      expect(validateNigerianMobile('09123456789').valid).toBe(true);
    });

    it('validates international format with +234 or 234', () => {
      expect(validateNigerianMobile('+234 803 123 4567').valid).toBe(true);
      expect(validateNigerianMobile('2348031234567').valid).toBe(true);
      expect(validateNigerianMobile('2348031234567').normalized).toBe('2348031234567');
    });

    it('rejects incomplete, non-mobile, or non-Nigerian prefixes', () => {
      expect(validateNigerianMobile('0803').valid).toBe(false);
      expect(validateNigerianMobile('012345678').valid).toBe(false);
      expect(validateNigerianMobile('02031234567').valid).toBe(false); // landline prefix
      expect(validateNigerianMobile('').valid).toBe(false);
    });
  });

  describe('toCanonicalPhone', () => {
    it('returns 234XXXXXXXXXX for valid numbers', () => {
      expect(toCanonicalPhone('0803 123 4567')).toBe('2348031234567');
      expect(toCanonicalPhone('+234 803 123 4567')).toBe('2348031234567');
    });

    it('returns null for invalid numbers', () => {
      expect(toCanonicalPhone('12345')).toBeNull();
    });
  });

  describe('formatPhoneDisplay', () => {
    it('formats canonical and national numbers to 0803 123 4567', () => {
      expect(formatPhoneDisplay('2348031234567')).toBe('0803 123 4567');
      expect(formatPhoneDisplay('08031234567')).toBe('0803 123 4567');
    });
  });

  describe('toE164', () => {
    it('returns +234XXXXXXXXXX for complete numbers', () => {
      expect(toE164('0803 123 4567')).toBe('+2348031234567');
    });
  });

  describe('lastFourDigits', () => {
    it('extracts last 4 digits of a valid phone', () => {
      expect(lastFourDigits('0803 123 4567')).toBe('4567');
    });
  });
});
