/**
 * Telling a real pickup point name from a leftover default.
 *
 * Why this matters more than it looks: the pickup point and park names are
 * printed into every arrival SMS a customer receives. "Default Park" in the
 * header is a cosmetic annoyance; "Default Park" in a text message sent to a
 * stranger is the business looking unfinished to its own customers. So the
 * screen refuses to show a placeholder at all, and asks for the real name
 * instead.
 *
 * Two kinds of placeholder exist today:
 *  - Literals that were hard-coded in the UI ("Default Park").
 *  - The name the server auto-generates at sign-up from the owner's first
 *    name, of the shape "George's Business". The owner never typed it, so it
 *    is not a real trading name and must not be presented as one.
 */

/** Exact names that were never chosen by a human. */
const PLACEHOLDER_LITERALS = new Set([
  'default park',
  'default',
  'default pickup point',
  'my business',
  'unnamed',
  'untitled',
  'n/a',
  'none',
]);

/**
 * "George's Business", "Ade’s business" — the auto-generated sign-up name.
 * Both the straight apostrophe and the typographic one, because the two get
 * mixed freely between the server and anything pasted in by hand.
 */
const AUTO_BUSINESS_NAME = /^.+['’]s\s+business$/i;

export function isPlaceholderName(value: string | null | undefined): boolean {
  if (!value) return true;

  const trimmed = value.trim();
  if (trimmed.length === 0) return true;

  if (PLACEHOLDER_LITERALS.has(trimmed.toLowerCase())) return true;
  if (AUTO_BUSINESS_NAME.test(trimmed)) return true;

  return false;
}

/** The name if a human chose it, otherwise nothing. Never a stand-in. */
export function realNameOrNull(value: string | null | undefined): string | null {
  return isPlaceholderName(value) ? null : (value as string).trim();
}
