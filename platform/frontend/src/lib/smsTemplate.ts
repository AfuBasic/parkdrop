/**
 * The customer arrival SMS — single source of truth for the frontend.
 *
 * This MUST stay in step with the backend sender in
 * platform/backend/app/Console/Commands/ProcessOutboxCommand.php
 * (renderArrivalSms). The pickup-point setup screen previews the real message
 * to the business owner, so if these two drift the preview becomes a lie.
 *
 * Cost note: Nigerian SMS is billed per segment. A single character outside
 * the GSM 03.38 alphabet (a curly quote, an en dash, an emoji) switches the
 * whole message to UCS-2 and drops the single-segment budget from 160
 * characters to 70 — more than doubling the cost of every arrival SMS. That
 * is why the template uses a plain hyphen and why we normalise typed names.
 */

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

export interface ArrivalSmsParts extends SmsNames {
  customerFirstName: string;
  packageId: string;
  pickupCode: string;
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
 * Render the arrival SMS exactly as the backend sends it.
 * The park clause is dropped when there is no park name.
 */
export function renderArrivalSms({
  customerFirstName,
  packageId,
  pickupCode,
  pickupPointName,
  parkName,
}: ArrivalSmsParts): string {
  const place = parkName.trim()
    ? `${pickupPointName.trim()}, ${parkName.trim()}`
    : pickupPointName.trim();

  return `Hi ${customerFirstName}, your parcel ${packageId} has arrived at ${place}. Use code ${pickupCode} to collect it. - ParkDrop`;
}

/**
 * Realistic worst-case stand-ins used both for the on-screen preview and for
 * computing how many characters the owner's two names may take up.
 * Reserving a long-ish customer first name keeps real messages inside one
 * segment rather than only the sample.
 */
export const SMS_PREVIEW_SAMPLE = {
  customerFirstName: 'Chinedu',
  packageId: 'PD-2841',
  pickupCode: '4821',
} as const;

const NAME_BUDGET_RESERVE = {
  /** Longest first name we plan for before the message spills over. */
  customerFirstName: 'Oluwafunmilayo',
  packageId: 'PD-88241',
  pickupCode: '482100',
} as const;

/**
 * How many characters the pickup point and park names may use between them
 * before the arrival SMS needs a second segment.
 *
 * Derived from the template itself rather than hard-coded, so editing
 * `renderArrivalSms` automatically re-derives the limit.
 */
export function combinedNameBudget(): number {
  const fixed = renderArrivalSms({
    ...NAME_BUDGET_RESERVE,
    pickupPointName: '',
    parkName: '',
  });
  // The empty-name render still carries the ", " joiner cost we must reserve.
  const overhead = countSeptets(fixed) + 2;
  return Math.max(0, GSM7_SINGLE_SEGMENT - overhead);
}

export interface SmsFit {
  /** The rendered preview message. */
  message: string;
  /** Characters the two names currently use. */
  used: number;
  /** Characters the two names may use in total. */
  budget: number;
  /** True when the message still fits in one SMS. */
  fitsOneSms: boolean;
  /** Characters present that would force the costly UCS-2 encoding. */
  unsupportedCharacters: string[];
}

/**
 * Quietly fold accented letters and curly punctuation down to their GSM-7
 * equivalents. Anything still unsupported afterwards (emoji, non-Latin
 * scripts) is reported so the screen can ask kindly for normal letters.
 */
export function normaliseForSms(value: string): string {
  return value
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[–—−]/g, '-')
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
export function checkSmsFit(names: SmsNames): SmsFit {
  const pickupPointName = normaliseForSms(names.pickupPointName);
  const parkName = normaliseForSms(names.parkName);

  const message = renderArrivalSms({
    ...SMS_PREVIEW_SAMPLE,
    pickupPointName,
    parkName,
  });

  const used = countSeptets(pickupPointName) + countSeptets(parkName);
  const budget = combinedNameBudget();

  return {
    message,
    used,
    budget,
    fitsOneSms: used <= budget,
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
 *
 * These are deliberately NOT refused on their own. "Peace Park" is a
 * perfectly plausible real park, and there is very likely a real
 * "Chima Parcel Services" — hard-blocking either would wall a legitimate
 * owner out of setup with no way forward, which is a worse failure than the
 * one it prevents. We only refuse them when BOTH fields match the examples
 * exactly, which is unmistakably someone copying what was on screen.
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
