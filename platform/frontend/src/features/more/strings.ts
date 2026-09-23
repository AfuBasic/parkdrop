/**
 * Every word the Settings screen says.
 *
 * Same house rules as the sign-in flow (features/auth/strings.ts):
 *  - Sentence case. Plain words. Around a Grade 5 reading level.
 *  - "Package", never "parcel", "consignment" or "item", in UI text.
 *  - Never "sync", "queue", "record", "entity", "offline-first", "local".
 *  - Never "workspace", "operational", "exceptions", "retries",
 *    "notification balance", "diagnostics", "device identity", "session".
 *  - A role is stated in a sentence, not carried by an uppercase pill.
 *  - Never condescending. The reader is busy, not slow.
 *
 * No screen in this feature may hard-code a user-visible string.
 */
export const MoreStrings = {
  // ── Title ──────────────────────────────────────────────────────────────
  /** Not "Settings & More". The screen is not two things. */
  title: 'Settings',

  // ── Who you are ────────────────────────────────────────────────────────
  signedInAs: 'Signed in as',
  /** "Your shop", never "Workspace". */
  shopLabel: 'Your shop',
  roleOwner: 'You are the owner here',
  roleManager: 'You are a manager here',
  roleAttendant: 'You are an attendant here',
  /** Used when the backend has not told us a role yet. */
  roleUnknown: 'You work here',

  // ── Group headings (18px, sentence case) ───────────────────────────────
  groupYourDay: 'Your day',
  groupMessages: 'Messages to customers',
  groupYourShop: 'Your shop',
  groupThisPhone: 'This phone',
  groupHelp: 'Getting help',

  // ── Rows ───────────────────────────────────────────────────────────────
  thingsToCheck: 'Things to check',
  thingsToCheckSub: 'Anything that needs you to decide',
  /** "3 to check" — the pill always carries a word, never a bare number. */
  thingsToCheckBadge: (n: number) => `${n > 99 ? '99+' : n} to check`,
  thingsToCheckBadgeLabel: (n: number) =>
    n === 1 ? '1 thing needs you' : `${n} things need you`,

  yourDay: 'Your day',
  yourDaySub: 'What happened today',

  smsCredits: 'SMS credits',
  smsCreditsSub: 'How many SMS you have left',
  smsCreditsBadge: (n: number) => (n === 1 ? '1 left' : `${n} left`),
  smsCreditsBadgeLabel: (n: number) =>
    n === 1 ? '1 SMS credit left' : `${n} SMS credits left`,

  yourTeam: 'Your team',
  yourTeamSub: 'Who can use ParkDrop here',

  shopDetails: 'Shop details',
  shopDetailsSub: 'Your name, your park, your phone number',

  thisPhone: 'This phone',
  thisPhoneSub: 'Which phones are signed in',

  howToUse: 'How to use ParkDrop',
  howToUseSub: 'Step-by-step guides',

  about: 'About ParkDrop',
  aboutSub: 'Version and privacy',

  /** Shown on a row that cannot work without a connection. */
  needsInternet: 'Needs internet',

  // ── Leaving ────────────────────────────────────────────────────────────
  signOut: 'Sign out',
  /** Replaces "Reset Device Identity", which explained nothing. */
  forgetMe: 'Sign out and forget me on this phone',

  // ── Leaving confirmations ──────────────────────────────────────────────
  /**
   * The safe choice is the primary button and the destructive one is the
   * secondary, following the pattern the plan sets for "Not you?" on Unlock
   * (§3.3.9). Both bodies lead with the reassurance, because the fear here is
   * losing the packages.
   */
  signOutTitle: 'Sign out of ParkDrop?',
  signOutBody:
    'Your packages stay safe. You will need a new code to sign in again.',

  forgetTitle: 'Sign out and forget you on this phone?',
  forgetBody:
    'Your packages stay safe. This phone will forget your name and email. You will need your email and a new code to sign in again.',

  stay: 'Stay signed in',
} as const;
