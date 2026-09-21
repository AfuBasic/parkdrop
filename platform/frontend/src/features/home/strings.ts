/**
 * Every word the Home dashboard says.
 *
 * Same house rules as the sign-in flow (features/auth/strings.ts):
 *  - Sentence case. Plain words. Around a Grade 5 reading level.
 *  - "Package", never "parcel", "consignment" or "item", in UI text.
 *  - Never "sync", "queue", "record", "entity", "offline-first".
 *  - Never condescending. The reader is busy, not slow.
 *  - Nothing here tells the user they did something wrong.
 *
 * No screen in this feature may hard-code a user-visible string.
 */
export const HomeStrings = {
  // ── Header ─────────────────────────────────────────────────────────────
  brand: 'ParkDrop',
  greetingMorning: 'Good morning',
  greetingAfternoon: 'Good afternoon',
  greetingEvening: 'Good evening',
  /** "Good afternoon, George" — the comma only appears when we know the name. */
  greeting: (part: string, name?: string | null) => (name ? `${part}, ${name}` : part),

  // ── Finish setup ───────────────────────────────────────────────────────
  setupTitle: 'Add your park name. Customers see it in the SMS.',
  setupAction: 'Add now',
  setupPointTitle: 'Add your pickup point name. Customers see it in the SMS.',

  // ── Sync chip ──────────────────────────────────────────────────────────
  syncSaved: 'All saved',
  syncSending: 'Sending…',
  syncOffline: 'No internet',
  syncAttention: 'Needs a look',
  syncChipHint: 'Where your packages are kept',
  syncSheetTitle: 'Your packages are safe',
  syncSheetBody:
    'Your packages are saved on this phone. They send when you are online.',
  syncSheetWaiting: (n: number) =>
    n === 1 ? '1 package is waiting to send.' : `${n} packages are waiting to send.`,
  syncSheetAllSent: 'Everything on this phone has been sent.',
  syncSheetClose: 'Close',

  // ── Action tiles ───────────────────────────────────────────────────────
  addTitle: 'Add package',
  addSubline: 'A package arrived',
  findTitle: 'Find package',
  findSubline: 'A customer is here',

  // ── Stat strip ─────────────────────────────────────────────────────────
  statWaiting: 'Waiting',
  statUnpaid: 'Unpaid',
  statCollected: 'Today',
  statCollectedFull: 'Collected today',
  /** Sits under the naira figure so the count is not lost. */
  statUnpaidCount: (n: number) => (n === 1 ? '1 package' : `${n} packages`),
  statWaitingHint: 'See packages waiting for pickup',
  statUnpaidHint: 'See packages that still owe money',
  statCollectedHint: 'See packages collected today',

  // ── List ───────────────────────────────────────────────────────────────
  listTitle: 'Waiting for pickup',
  filterAll: 'All',
  filterUnpaid: 'Unpaid',
  seeAll: (n: number) => (n === 1 ? 'See 1 package' : `See all ${n} packages`),
  rowHint: (name: string) => `Open ${name}'s package`,

  // Payment chips
  payUnpaid: 'Unpaid',
  payPart: 'Part paid',
  payPaid: 'Paid',

  // Age chips
  ageToday: 'Today',
  ageYesterday: 'Yesterday',
  ageDays: (n: number) => `${n} days`,

  // ── Empty state (first day) ────────────────────────────────────────────
  emptyTitle: 'Your first package',
  emptyStep1: "Type the customer's phone number.",
  emptyStep2: 'Type the amount.',
  emptyStep3: 'Tap Save.',
  emptyOutcome: 'ParkDrop texts your customer their pickup code.',

  // Nothing matches the Unpaid filter, but packages do exist.
  emptyFilterTitle: 'Nothing unpaid',
  emptyFilterBody: 'Every package waiting for pickup has been paid for.',

  // ── States ─────────────────────────────────────────────────────────────
  loading: 'Loading your packages',
  errorTitle: 'Could not load your packages.',
  errorAction: 'Try again',
  offlineBanner: 'No internet. You can still add and find packages.',

  // ── Bottom navigation ──────────────────────────────────────────────────
  navHome: 'Home',
  navPackages: 'Packages',
  navCustomers: 'Customers',
  navMore: 'More',
} as const;
