/**
 * Every word the Account & Security ("This phone") screen says.
 *
 * Same house rules as the other migrated features:
 *  - Sentence case. Plain words. Around a Grade 5 reading level.
 *  - Never condescending. The reader is busy, not slow.
 *
 * Design plan 02 §3.3.35: "Account & Security" becomes "This phone" because
 * *account*, *security*, *session* and *device* are four abstractions where
 * one concrete noun does the job.
 *
 * No screen in this feature may hard-code a user-visible string.
 */
export const AccountStrings = {
  title: 'This phone',

  // ── Who you are ───────────────────────────────────────────────────────
  whoYouAreHeading: 'Who you are',
  emailLabel: 'Your email',
  signInMethod: 'You sign in with a code we send to your email.',
  nameLabel: 'Your name',
  nameNotSet: 'Not set',
  changeName: 'Change',
  namePlaceholder: 'Your first name',
  nameTooShort: 'Enter at least 2 characters.',
  nameTooLong: 'Keep it under 100 characters.',
  couldNotUpdateName: 'Could not update your name. Try again.',
  nameUpdated: 'Your name was updated.',
  save: 'Save',
  saving: 'Saving…',
  cancel: 'Cancel',
  workplacesHeading: 'Where you work',

  // ── This phone ────────────────────────────────────────────────────────
  thisPhoneHeading: 'This phone',
  thisPhoneLabel: 'This phone',
  thisPhoneBody: 'Your PIN opens ParkDrop on this phone.',
  offlineReady: 'Ready offline',
  offlineUntil: (when: string) => `Works offline until ${when}`,
  offlineExpired: 'Your offline access has run out. Connect to the internet to keep using ParkDrop.',

  // ── Other phones ──────────────────────────────────────────────────────
  otherPhonesHeading: 'Other phones',
  revokeAllOthers: 'Sign all other phones out',
  revokeAllOthersConfirmTitle: 'Sign all other phones out?',
  revokeAllOthersConfirmBody: 'Anyone using ParkDrop on another phone will be signed out right away.',
  revokeAllOthersConfirmAction: 'Yes, sign them out',
  revokeAllOthersCancelAction: 'Cancel',
  revokingOthers: 'Signing them out…',
  couldNotRevokeOthers: 'Could not sign out other phones. Try again.',
  onlyThisPhone: 'Only this phone is signed in.',
  active: 'Active',
  signedOut: 'Signed out',
  lastUsed: (age: string) => `Last used ${age}`,
  addedOn: (age: string) => `Added ${age}`,
  signThisPhoneOut: 'Sign this phone out',
  signingOut: 'Signing out…',
  couldNotRevoke: 'Could not sign out that phone. Try again.',

  // ── Sign out ──────────────────────────────────────────────────────────
  activeSessionHeading: 'Sign out',
  signOutBody:
    'Signing out clears this phone. Anything saved here that has not sent yet stays safe and sends when you sign back in.',
  signOut: 'Sign out',

  // ── Sign-out-with-pending-work dialog ────────────────────────────────
  pendingTitle: 'You have work that has not sent yet',
  pendingCount: (n: number) => `${n} ${n === 1 ? 'change' : 'changes'} waiting to send`,
  pendingBody: (n: number) =>
    n > 1
      ? `This phone has changes from ${n} businesses that have not reached ParkDrop yet.`
      : 'This phone has changes that have not reached ParkDrop yet.',
  pendingBusinessLine: (id: number, count: number) => `Business #${id} · ${count} waiting`,
  syncAndSignOut: 'Send it now, then sign out',
  syncing: 'Sending…',
  signOutAnyway: 'Sign out anyway',
  signOutAnywayNote: 'Nothing is lost. It sends the next time you sign in here.',
  staySignedIn: 'Stay signed in',

  couldNotLoad: 'Could not load your account. Try again.',
  loading: 'Loading…',
} as const;
