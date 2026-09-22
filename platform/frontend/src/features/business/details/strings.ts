/**
 * Every word the Business details screen says.
 *
 * Same house rules as the other migrated features:
 *  - Sentence case. Plain words. Around a Grade 5 reading level.
 *  - Never condescending. The reader is busy, not slow.
 *
 * Design plan 02 §3.3.34 calls this "Shop details" and proposes splitting it
 * into four editing sheets; this pass keeps the existing screen shape (a
 * rename and a structural split are separate, larger changes) and brings the
 * copy, type scale and tokens in line with the rest of the app.
 *
 * No screen in this feature may hard-code a user-visible string.
 */
export const BusinessDetailsStrings = {
  title: 'Business details',

  businessName: "Your business's name",
  pickupPoint: 'Your pickup point',
  park: 'The park',
  contactPhone: 'The number customers call',

  edit: 'Edit',
  add: 'Add',
  save: 'Save',
  saving: 'Saving…',
  cancel: 'Cancel',

  namePlaceholderNote: 'Must be at least 2 characters.',
  nameTooShort: 'Enter at least 2 characters.',
  nameUpdated: 'Business name updated.',
  couldNotUpdateName: 'Could not update the business name. Try again.',

  noPickupPoint: 'No pickup point set up for this business yet.',
  noPhoneYet: 'No phone number added yet. Customers get the SMS without a number to call.',
  phoneHelperText: 'This number is printed on the SMS customers get when their package arrives.',

  phoneLabel: 'Phone number',
  phoneInputHelp: 'Enter an 11-digit Nigerian mobile number.',
  continueWithPin: 'Continue with PIN',
  phoneUpdated: "Your shop's phone number was updated.",
  couldNotUpdatePhone: 'Could not update the phone number. Check your connection.',
  smsTooLong: 'This phone number makes the SMS too long. Contact support.',
  phoneChangeLimitReached:
    'You have changed this number 3 times today. Try again tomorrow.',

  pinTitle: 'Enter your 4-digit PIN',
  pinBody: 'Confirm your PIN to update the phone number customers call. Up to 3 changes a day.',
  pinIncomplete: 'Enter your 4-digit PIN.',
  pinWrong: 'Wrong PIN. Try again.',
  confirmAndSave: 'Confirm and save',
  verifying: 'Checking…',

  yourRole: 'Your role',
  roleBody: {
    owner: 'You have full access to this business.',
    manager: 'You can run the shop and see the team.',
    attendant: 'You can add and give out packages.',
  } as const,

  couldNotLoad: 'Could not load business details. Check your connection and try again.',
  tryAgain: 'Try again',
} as const;
