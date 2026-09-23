/**
 * Nigerian mobile number handling for the sign-in screen.
 *
 * People type and paste their number in every shape there is: 0803 123 4567,
 * 8031234567, +234 803 123 4567, 234-803-123-4567, or with stray spaces from a
 * contact card. All of those are the same number and all of them are accepted.
 * Whatever goes in, the field always shows the one shape people recognise from
 * their own phone: 0803 123 4567.
 */

/** Nigeria. The only country code the flow handles today. */
export const COUNTRY_CODE = '234';
export const NATIONAL_LENGTH = 10; // digits after the leading 0

/**
 * Reduce any input to the 10 significant digits (without the leading 0 and
 * without the country code). Returns at most NATIONAL_LENGTH digits.
 */
export function toNationalDigits(input: string): string {
  let digits = input.replace(/\D/g, '');

  // Strip the country code, with or without a leading 00.
  if (digits.startsWith('00' + COUNTRY_CODE)) digits = digits.slice(2 + COUNTRY_CODE.length);
  else if (digits.startsWith(COUNTRY_CODE) && digits.length > NATIONAL_LENGTH) {
    digits = digits.slice(COUNTRY_CODE.length);
  }

  // Strip the national trunk prefix.
  while (digits.startsWith('0')) digits = digits.slice(1);

  return digits.slice(0, NATIONAL_LENGTH);
}

/**
 * Display form, always 0803 123 4567 regardless of how it was typed.
 * Formats progressively so the grouping appears as the user types.
 */
export function formatNationalDisplay(input: string): string {
  const digits = toNationalDigits(input);
  if (!digits) return '';

  const withTrunk = '0' + digits;
  // 0803 123 4567 -> groups of 4, 3, 4
  const a = withTrunk.slice(0, 4);
  const b = withTrunk.slice(4, 7);
  const c = withTrunk.slice(7, 11);

  return [a, b, c].filter(Boolean).join(' ');
}

/** True once a complete national number has been entered. */
export function isCompletePhone(input: string): boolean {
  return toNationalDigits(input).length === NATIONAL_LENGTH;
}

/**
 * Validates a Nigerian mobile number:
 * Must have exactly 10 national digits starting with 7, 8, or 9 (e.g. 080..., 070..., 090...).
 */
export function validateNigerianMobile(input: string): { valid: boolean; normalized?: string; error?: string } {
  const digits = toNationalDigits(input);
  if (!digits) {
    return { valid: false, error: 'Type your phone number to continue.' };
  }
  if (digits.length !== NATIONAL_LENGTH) {
    return { valid: false, error: 'Enter your 11-digit number, like 0803 123 4567.' };
  }
  if (!/^[789][01]\d{8}$/.test(digits)) {
    return { valid: false, error: 'Please enter a valid Nigerian mobile number.' };
  }
  return { valid: true, normalized: `234${digits}` };
}

/**
 * Canonical form for storage: 234XXXXXXXXXX.
 */
export function toCanonicalPhone(input: string): string | null {
  const { valid, normalized } = validateNigerianMobile(input);
  return valid && normalized ? normalized : null;
}

/**
 * Format any phone number into standard display format: 0803 123 4567.
 */
export function formatPhoneDisplay(input: string): string {
  return formatNationalDisplay(input);
}

/**
 * E.164 form for sending to the backend, e.g. +2348031234567.
 * Returns null when the number is not yet complete.
 */
export function toE164(input: string): string | null {
  const digits = toNationalDigits(input);
  if (digits.length !== NATIONAL_LENGTH) return null;
  return `+${COUNTRY_CODE}${digits}`;
}

/** The last four digits, used to block them as a PIN. */
export function lastFourDigits(input: string): string | null {
  const digits = toNationalDigits(input);
  return digits.length === NATIONAL_LENGTH ? digits.slice(-4) : null;
}

/**
 * How many display characters sit before the given digit index. Used to keep
 * the caret in the right place after re-formatting, so typing in the middle of
 * a number does not throw the cursor to the end.
 */
export function caretPositionForDigitCount(digitCount: number): number {
  const sample = formatNationalDisplay('0'.repeat(Math.max(1, digitCount + 1)));
  let seen = 0;
  for (let i = 0; i < sample.length; i++) {
    if (/\d/.test(sample[i])) {
      seen++;
      // +1 because the leading trunk zero is not a typed digit.
      if (seen === digitCount + 1) return i + 1;
    }
  }
  return sample.length;
}
