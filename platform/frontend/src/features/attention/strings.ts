/**
 * Every word the "Things to check" screen says.
 *
 * Same house rules as the sign-in flow (features/auth/strings.ts):
 *  - Sentence case. Plain words. Around a Grade 5 reading level.
 *  - "Package", never "parcel", "consignment" or "item", in UI text.
 *  - Never "sync", "upload", "queue", "status", "retry", "verify", "local".
 *  - Never condescending. The reader is busy, not slow.
 *
 * The governing idea of this screen, from design plan 02 §3.3.27: every
 * message is a consequence for the person's work, not a system event.
 * "Photo upload failed" is a fact about the app. "A photo did not send —
 * Chinedu's package photo is still on this phone" is a fact about their day.
 *
 * No screen in this feature may hard-code a user-visible string.
 */
export const AttentionStrings = {
  /** Not "Attention" — a noun that does not say what you will find. */
  title: 'Things to check',

  /** "1 thing needs you." / "2 things need you." */
  countLine: (n: number) => (n === 1 ? '1 thing needs you.' : `${n} things need you.`),

  // ── Empty, which is the normal case and should feel like one ───────────
  emptyTitle: 'Nothing to check.',
  emptyBody: 'Everything is going fine. We will tell you here if that changes.',

  // ── Offline ────────────────────────────────────────────────────────────
  offlineStrip: 'No internet. Showing what is saved on this phone.',
  /**
   * Shown on the card itself, before the button is tapped — not as a toast.
   * A toast at the bottom of the screen is missed by someone looking at
   * their finger at the top, and it leaves before a slow reader finishes it.
   */
  needsInternet: 'You need internet to do this.',

  // ── Relative time on a card ────────────────────────────────────────────
  justNow: 'Just now',
  yesterday: 'Yesterday',
} as const;
