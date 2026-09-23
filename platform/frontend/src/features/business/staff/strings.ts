/**
 * Every word the Your team (Staff) screen says.
 *
 * Same house rules as the other migrated features:
 *  - Sentence case. Plain words. Around a Grade 5 reading level.
 *  - Roles are written as what a person can do, not as a job title — an
 *    uppercase "ATTENDANT" pill tells nobody what that person can do; the
 *    permission matrix is the only thing the reader actually wants
 *    (design plan 02 §3.3.31).
 *  - Never condescending. The reader is busy, not slow.
 *
 * No screen in this feature may hard-code a user-visible string.
 */
export const StaffStrings = {
  title: 'Your team',
  count: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,

  roleSentence: {
    owner: 'Can do everything',
    manager: 'Can run the shop',
    attendant: 'Can add and give out packages',
  } as const,

  invite: 'Invite someone',

  waitingToJoin: 'Waiting to join',
  sentAgo: (age: string) => `Sent ${age}`,
  sendAgain: 'Send again',
  sending: 'Sending…',
  cancelInvite: 'Cancel invite',
  cancelling: 'Cancelling…',

  you: 'You',

  empty: 'It is just you for now.',
  emptyBody: 'Invite someone if you want help running this shop.',

  offlineTitle: 'No internet. You can see your team but not change it.',
  offlineBody: 'Turn on your data to invite or remove someone.',

  lastOwnerTitle: 'You cannot remove the last owner.',
  lastOwnerBody: 'Make someone else an owner first, then you can remove yourself.',

  couldNotLoad: 'Could not load your team. Check your connection and try again.',
  tryAgain: 'Try again',
  couldNotResend: 'Could not resend that invite.',
  couldNotCancel: 'Could not cancel that invite.',

  // ── Member actions sheet ─────────────────────────────────────────────
  changeRole: 'Change role',
  removeAccess: 'Remove access',
  removeAccessBody: (name: string) =>
    `${name} will no longer be able to use ParkDrop here. Past packages and payments stay on record.`,
  pickNewRole: (name: string) => `Pick a new role for ${name}`,
  saveRole: 'Save role',
  saving: 'Saving…',
  cancel: 'Cancel',
  removing: 'Removing…',
  couldNotChangeRole: 'Could not change this role. Try again.',
  couldNotRemove: 'Could not remove access. Try again.',

  // ── Invite someone sheet ─────────────────────────────────────────────
  inviteTitle: 'Invite someone',
  inviteBody: "We'll email them a link to join this business.",
  emailLabel: 'Their email address',
  emailPlaceholder: 'e.g. emeka@example.com',
  invalidEmail: 'Enter a valid email address.',
  roleLabel: 'What they can do',
  sendInvite: 'Send invite',
  couldNotInvite: 'Could not send that invite. Try again.',
} as const;
