/**
 * Every word the Buy SMS credits screen says.
 *
 * Same house rules as `features/sms-credits/strings.ts`:
 *  - Sentence case. Plain words. Around a Grade 5 reading level.
 *  - Never "sync", "outbound", "verification", "top-up".
 *  - Never condescending. The reader is busy, not slow.
 *
 * Design plan 02 §3.3.30: the bottom bar is absent on this screen, and the
 * "paid but unconfirmed" state is the one that actually frightens people —
 * money has left and nothing has arrived — so it gets its own words.
 *
 * No screen in this feature may hard-code a user-visible string.
 */
export const BuySmsCreditsStrings = {
  title: 'Buy SMS credits',
  currentBalance: (n: number) => `You have ${n} ${n === 1 ? 'SMS' : 'SMS'} now`,

  chooseHeading: 'Choose an amount',
  /** e.g. "Enough for about 200 packages" — one SMS per package (P10). */
  enoughFor: (packages: number) => `Enough for about ${packages} packages`,

  continueToPayment: 'Continue to payment',
  payNote: 'You pay on the next screen. ParkDrop never sees your card.',
  pickABundle: 'Pick a bundle to continue.',

  // ── Offline ────────────────────────────────────────────────────────────
  offlineTitle: 'You need internet to buy SMS credits.',
  offlineBody: 'Turn on your data and come back.',

  // ── Starting / confirming ─────────────────────────────────────────────
  starting: 'Getting your payment ready…',
  confirmingTitle: 'Checking your payment…',
  confirmingBody: 'Please wait. Do not close ParkDrop.',

  // ── Pending ────────────────────────────────────────────────────────────
  pendingTitle: 'We are still checking your payment.',
  pendingBody:
    'This can take a few minutes. Your SMS will appear here when it is done. You can close ParkDrop.',
  checkAgain: 'Check again',

  // ── Success ────────────────────────────────────────────────────────────
  successTitle: (balance: number) => `Done. You now have ${balance} SMS.`,
  goBack: 'Go back',

  // ── Failure ────────────────────────────────────────────────────────────
  failedToStartTitle: 'Could not start the payment.',
  tryAgain: 'Try again',

  // ── Paid but not yet confirmed ────────────────────────────────────────
  paidUnconfirmedTitle: 'Your payment went through. We are still adding your SMS.',
  paidUnconfirmedBody: 'This can take a few minutes.',
  callUs: 'Call us',

  couldNotLoadBundles: 'Could not load SMS bundles. Check your connection.',
} as const;
