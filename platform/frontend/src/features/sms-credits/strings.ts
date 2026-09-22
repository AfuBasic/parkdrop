/**
 * Every word the SMS credits screens say.
 *
 * Same house rules as the sign-in flow (features/auth/strings.ts):
 *  - Sentence case. Plain words. Around a Grade 5 reading level.
 *  - "Package", never "parcel", "consignment", "item" or "recipient".
 *  - Never "sync", "balance" as a heading, "notification", "top-up",
 *    "outbound", "intake", "verification".
 *  - Never condescending. The reader is busy, not slow.
 *
 * The sentence that makes the number mean anything is
 * `Each package you add uses 1 SMS.` — a balance of 47 is meaningless until
 * it is 47 *packages* (design plan 02 §3.3.29).
 *
 * No screen in this feature may hard-code a user-visible string.
 */
export const SmsCreditsStrings = {
  title: 'SMS credits',

  // ── The number ─────────────────────────────────────────────────────────
  smsLeft: 'SMS left',
  costLine: 'Each package you add uses 1 SMS.',

  // ── States ─────────────────────────────────────────────────────────────
  lowTitle: 'You are running low.',
  lowBody:
    'When these run out, your customers stop getting a text with their pickup code.',

  zeroTitle: 'You have no SMS left.',
  /** Says what still works, not only what does not. */
  zeroBody:
    'Your customers are not getting their pickup code by text. You can still add and find packages.',

  // ── Actions ────────────────────────────────────────────────────────────
  buy: 'Buy SMS credits',
  /** An attendant has no primary action here; they have a next step instead. */
  askManager: 'Ask your manager to buy more.',

  // ── History ────────────────────────────────────────────────────────────
  historyTitle: 'What you used them on',
  historyEmpty: 'Nothing yet.',
  /** "1 SMS" / "50 SMS", and "+50 SMS" when credits were bought. */
  smsCount: (n: number) => `${n} SMS`,
  smsAdded: (n: number) => `+${n} SMS`,
  boughtCredits: 'You bought credits',
  packageSms: "A customer's package",

  // ── Offline ────────────────────────────────────────────────────────────
  /**
   * Says how old the number is. The previous copy — "Showing last synced
   * balance. Will refresh when connected." — used a banned word and gave no
   * age, which is the one thing a person needs in order to trust it.
   */
  offlineAge: (age: string) => `No internet. This was ${age}.`,
  offlineNoAge: 'No internet. This is the last number this phone saw.',
  refresh: 'Refresh',
} as const;
