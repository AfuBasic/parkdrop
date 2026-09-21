/**
 * The customer arrival SMS — single source of truth for frontend and backend.
 *
 * This MUST stay in step with the backend sender in
 * platform/backend/app/Console/Commands/ProcessOutboxCommand.php.
 * The pickup-point setup screens preview the real message to the business owner,
 * so if these two drift the preview becomes a lie.
 *
 * Hard limit: 130 characters.
 * Template:
 *   Your package is at {pickupPoint}, {park}.
 *   Show code {code} at pickup.
 *   Call: {phone}
 *   ParkDrop
 *
 * (The "Call: {phone}\n" line is omitted if no phone is present).
 */

import { PICKUP_CODE_LENGTH } from '@/features/packages/domain/PackageCodeGenerator';

/** Hard character limit for arrival SMS across client and server. */
export const SMS_MAX_CHARS = 130;

/** Single-segment budget for a GSM 03.38 message. */
export const GSM7_SINGLE_SEGMENT = 160;
/** Single-segment budget once any non-GSM-7 character forces UCS-2. */
export const UCS2_SINGLE_SEGMENT = 70;

/**
 * Characters in the GSM 03.38 basic alphabet, plus the extension-table
 * characters. Extension characters ({ } [ ] ~ ^ \ | and the euro sign) cost
 * two septets each, which `countSeptets` accounts for.
 */
const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

const GSM7_EXTENDED = '^{}\\[~]|€';

export interface SmsNames {
  /** The pickup point, e.g. "Chima Parcel Services". */
  pickupPointName: string;
  /** The park the pickup point sits in, e.g. "Peace Park". */
  parkName: string;
}

export interface CustomerSmsParts extends SmsNames {
  phone?: string | null;
  code: string;
}

export interface RenderCustomerSmsResult {
  text: string;
  length: number;
  valid: boolean;
  reason?: 'TOO_LONG' | 'NON_GSM7' | 'EMPTY_NAME';
}

/** True when every character can be sent in a single-byte GSM-7 message. */
export function isGsm7(text: string): boolean {
  for (const ch of text) {
    if (!GSM7_BASIC.includes(ch) && !GSM7_EXTENDED.includes(ch)) return false;
  }
  return true;
}

/** Length of `text` in septets, counting extension characters as two. */
export function countSeptets(text: string): number {
  let total = 0;
  for (const ch of text) {
    if (GSM7_EXTENDED.includes(ch)) total += 2;
    else total += 1;
  }
  return total;
}

/**
 * Render customer SMS according to standard template:
 * Your package is at {pickupPoint}, {park}.
 * Show code {code} at pickup.
 * Call: {phone}
 * ParkDrop
 */
export function renderCustomerSms({
  pickupPointName,
  parkName,
  phone,
  code,
}: CustomerSmsParts): RenderCustomerSmsResult {
  const cleanPoint = normaliseForSms(pickupPointName).trim();
  const cleanPark = normaliseForSms(parkName).trim();

  const place = cleanPark !== ''
    ? (cleanPoint !== '' ? `${cleanPoint}, ${cleanPark}` : cleanPark)
    : cleanPoint;

  let callLine = '';
  if (phone) {
    const rawDigits = phone.replace(/\D/g, '');
    let displayPhone = rawDigits;
    if (rawDigits.startsWith('234') && rawDigits.length === 13) {
      displayPhone = '0' + rawDigits.slice(3);
    } else if (!rawDigits.startsWith('0') && rawDigits.length === 10) {
      displayPhone = '0' + rawDigits;
    }
    if (displayPhone) {
      callLine = `Call: ${displayPhone}\n`;
    }
  }

  const text = `Your package is at ${place}.\nShow code ${code} at pickup.\n${callLine}ParkDrop`;
  const septetCount = countSeptets(text);
  const isAllGsm7 = isGsm7(text);

  let valid = true;
  let reason: RenderCustomerSmsResult['reason'] = undefined;

  if (cleanPoint === '' && cleanPark === '') {
    valid = false;
    reason = 'EMPTY_NAME';
  } else if (!isAllGsm7) {
    valid = false;
    reason = 'NON_GSM7';
  } else if (septetCount > SMS_MAX_CHARS) {
    valid = false;
    reason = 'TOO_LONG';
  }

  return {
    text,
    length: septetCount,
    valid,
    reason,
  };
}

/**
 * Backwards-compatibility wrapper for any legacy call site.
 */
export function renderArrivalSms(parts: {
  customerFirstName?: string;
  packageId?: string;
  pickupCode: string;
  pickupPointName: string;
  parkName: string;
  phone?: string | null;
}): string {
  return renderCustomerSms({
    pickupPointName: parts.pickupPointName,
    parkName: parts.parkName,
    phone: parts.phone ?? null,
    code: parts.pickupCode,
  }).text;
}

/**
 * Realistic worst-case stand-ins used for computing preview limits.
 */
export const SMS_PREVIEW_SAMPLE = {
  pickupCode: '4821',
  phone: '08031234567',
} as const;

/**
 * How many characters the pickup point and park names may use between them
 * before the arrival SMS exceeds SMS_MAX_CHARS (130 chars).
 *
 * Computed against the longest possible code length (PICKUP_CODE_LENGTH)
 * and an 11-digit phone number so the user never exceeds 130 characters.
 */
export function combinedNameBudget(): number {
  const worstCaseCode = 'A'.repeat(PICKUP_CODE_LENGTH); // 7 chars
  const worstCasePhone = '08031234567'; // 11 chars
  const emptyRender = renderCustomerSms({
    pickupPointName: '',
    parkName: '',
    phone: worstCasePhone,
    code: worstCaseCode,
  });

  // The empty-name render plus ", " joiner overhead
  const overhead = countSeptets(emptyRender.text) + 2;
  return Math.max(0, SMS_MAX_CHARS - overhead);
}

export interface SmsFit {
  /** The rendered preview message. */
  message: string;
  /** Characters the two names currently use. */
  used: number;
  /** Characters the two names may use in total. */
  budget: number;
  /** True when the message still fits within the 130 character limit. */
  fitsOneSms: boolean;
  /** Characters present that would force the costly UCS-2 encoding. */
  unsupportedCharacters: string[];
}

/**
 * Quietly fold accented letters and curly punctuation down to their GSM-7
 * equivalents. Anything still unsupported afterwards (emoji, non-Latin
 * scripts) is reported so the screen can ask kindly for normal letters.
 */
export function normaliseForSms(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/[·•]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .normalize('NFD')
    // Strip combining marks so "Ṣèyí" becomes "Seyi" rather than breaking GSM-7.
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC');
}

/** Characters left in `value` that GSM-7 cannot carry. */
export function unsupportedCharacters(value: string): string[] {
  const found = new Set<string>();
  for (const ch of value) {
    if (!GSM7_BASIC.includes(ch) && !GSM7_EXTENDED.includes(ch)) found.add(ch);
  }
  return [...found];
}

/** Everything the pickup-point screen needs to render and police the preview. */
export function checkSmsFit(names: SmsNames, phone: string = SMS_PREVIEW_SAMPLE.phone): SmsFit {
  const pickupPointName = normaliseForSms(names.pickupPointName);
  const parkName = normaliseForSms(names.parkName);

  const rendered = renderCustomerSms({
    code: SMS_PREVIEW_SAMPLE.pickupCode,
    pickupPointName,
    parkName,
    phone,
  });

  const used = countSeptets(pickupPointName) + countSeptets(parkName);
  const budget = combinedNameBudget();

  return {
    message: rendered.text,
    used,
    budget,
    fitsOneSms: rendered.valid && rendered.length <= SMS_MAX_CHARS,
    unsupportedCharacters: unsupportedCharacters(pickupPointName + parkName),
  };
}

/**
 * Names that are never a real business or park — seed data, filler and
 * stand-ins. These are always refused.
 */
export const JUNK_NAMES = [
  'default park',
  'default pickup point',
  'default',
  'pickup point',
  'my park',
  'park',
  'test',
  'testing',
  'asdf',
  'n/a',
  'na',
  'none',
  'xxx',
] as const;

/**
 * The example names printed on the setup screen as placeholders.
 */
export const EXAMPLE_NAMES = {
  pickupPoint: 'chima parcel services',
  park: 'peace park',
} as const;

function clean(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** True when `value` is filler that could never be a real name. */
export function isPlaceholderName(value: string): boolean {
  return (JUNK_NAMES as readonly string[]).includes(clean(value));
}

/** True when both fields are just the examples copied off the screen. */
export function isExamplePair(pickupPointName: string, parkName: string): boolean {
  return (
    clean(pickupPointName) === EXAMPLE_NAMES.pickupPoint &&
    clean(parkName) === EXAMPLE_NAMES.park
  );
}
