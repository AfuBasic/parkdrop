/**
 * User-facing copy for the Add Package flow.
 *
 * Rules:
 *  - Sentence case. Plain words. Grade 5 reading level.
 *  - "Package", never "parcel", "item", or "consignment".
 *  - Never jargon: no "entity", "submit", "validate", "sync", "record".
 *  - Blame-free errors that clearly explain the fix.
 */
export const AddPackageStrings = {
  // ── Header & Navigation ──────────────────────────────────────────────────
  title: 'Add package',
  close: 'Close',
  discardTitle: 'Leave without saving?',
  discardBody: 'Your entered details haven’t been saved yet.',
  discardStay: 'Stay',
  discardLeave: 'Leave',

  // ── Form Fields ──────────────────────────────────────────────────────────
  phoneLabel: 'Customer’s phone number',
  phonePlaceholder: '0803 123 4567',
  phoneClear: 'Clear phone number',
  phoneErrorMissing: 'Enter the 11-digit phone number, like 0803 123 4567.',

  // Suggestions
  suggestionsTitle: 'Known customers',

  // Match Chip
  matchCollectedBefore: (count: number) =>
    count === 1 ? 'Collected 1 before' : `Collected ${count} before`,
  matchHasWaiting: (count: number) =>
    count === 1 ? 'Has 1 package waiting' : `Has ${count} packages waiting`,
  matchChange: 'Change',

  // Name Field
  nameLabel: 'Name (you can skip this)',
  namePlaceholder: 'Chinedu Okafor',
  nameClear: 'Clear name',

  // Amount Field
  amountLabel: 'Amount to pay',
  amountHelper: 'Type 0 if there is nothing to pay.',
  amountErrorMissing: 'Type the amount. Type 0 if there is nothing to pay.',
  amountLastPrefix: 'Last ',
  amountNothingToPay: 'Nothing to pay',

  // Duplicate Warning
  duplicateWaitingWarning: (name: string, count: number) =>
    count === 1
      ? `${name} already has 1 package waiting.`
      : `${name} already has ${count} packages waiting.`,

  // Actions
  saveAction: 'Save package',
  savingAction: 'Saving…',

  // ── Success Screen ───────────────────────────────────────────────────────
  savedTitle: 'Saved',
  writeInstruction: 'Write this on the package:',
  pickupCodeLabel: 'Customer’s pickup code',
  smsSent: (phone: string) => `SMS sent to ${phone}`,
  smsSending: 'Sending SMS…',
  smsOffline: 'SMS will send when you are online.',

  nextPackageAction: 'Next package',
  addPhotoAction: 'Add photo',
  retakePhotoAction: 'Retake photo',
  removePhotoAction: 'Remove',
  whatsappAction: 'Tell customer on WhatsApp',

  undoCountdown: (seconds: number) => `Undo (${seconds})`,
  packageVoided: 'Package cancelled.',
  goHome: 'Go home',
};
