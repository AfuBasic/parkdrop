/**
 * Which 4-digit PINs we refuse, and why.
 *
 * This is a small, honest guard, not security theatre. The PIN only unlocks
 * the app on one phone, and it is checked against a hash held on that phone.
 * What it actually protects against is the case that matters here: a shared or
 * borrowed phone where someone else guesses the obvious ones in a few tries.
 *
 * We reject only PINs that a stranger would realistically try early, so the
 * rule stays explainable in one sentence. We never tell the user their choice
 * was stupid — the message is "too easy to guess", which is about the guesser.
 */

/**
 * PINs that show up at the top of every leaked-PIN analysis, plus the
 * keypad-shape ones (2580 is straight down the middle of a phone keypad).
 */
const BANNED_EXACT = new Set([
  '1234', '4321', '0000', '1111', '2222', '3333', '4444', '5555', '6666',
  '7777', '8888', '9999', '1212', '2121', '1122', '2211', '1010', '2020',
  '2580', '0852', '1379', '9731', '1230', '4444', '6969', '1004', '2000',
  '2001', '1313', '6060', '1313', '5150', '1999', '2468', '1357', '0123',
]);

export type PinRejection = 'too-easy' | null;

/** All four digits the same, e.g. 7777. */
function isRepeated(pin: string): boolean {
  return new Set(pin).size === 1;
}

/** Runs straight up or straight down, e.g. 3456 or 8765. */
function isSequential(pin: string): boolean {
  let ascending = true;
  let descending = true;

  for (let i = 1; i < pin.length; i++) {
    const delta = Number(pin[i]) - Number(pin[i - 1]);
    if (delta !== 1) ascending = false;
    if (delta !== -1) descending = false;
  }

  return ascending || descending;
}

/** Two digits repeated, e.g. 1212, or two pairs, e.g. 1122. */
function isSimplePattern(pin: string): boolean {
  const [a, b, c, d] = pin;
  if (a === c && b === d) return true; // ABAB
  if (a === b && c === d) return true; // AABB
  if (a === d && b === c) return true; // ABBA
  return false;
}

export interface PinCheckContext {
  /** The signed-in phone number, if known. Its last four are refused. */
  phone?: string | null;
}

/**
 * Returns a rejection reason, or null when the PIN is acceptable.
 */
export function checkPin(pin: string, context: PinCheckContext = {}): PinRejection {
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return 'too-easy';

  if (BANNED_EXACT.has(pin)) return 'too-easy';
  if (isRepeated(pin)) return 'too-easy';
  if (isSequential(pin)) return 'too-easy';
  if (isSimplePattern(pin)) return 'too-easy';

  // The last four digits of their own number: printed on their own phone,
  // known to everyone they have ever given it to.
  if (context.phone) {
    const digits = context.phone.replace(/\D/g, '');
    if (digits.length >= 4 && digits.slice(-4) === pin) return 'too-easy';
  }

  return null;
}
