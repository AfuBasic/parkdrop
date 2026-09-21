import type { IdentifierMode } from './config';

/**
 * Every word the sign-in and first-run screens say.
 *
 * House rules for anything added here:
 *  - Sentence case. Plain words. Around a Grade 5 reading level.
 *  - Never "OTP", "verify", "authenticate", "credentials", "session", "token".
 *  - "Package", never "parcel", in UI text. The customer SMS template is fixed
 *    and is the one exception — it lives in lib/smsTemplate.ts.
 *  - Errors are blame-free, say exactly what is missing, and end with a next
 *    step. Never tell someone they did something wrong.
 */
export const AuthStrings = {
  // ── Shared chrome ──────────────────────────────────────────────────────
  back: 'Back',
  needHelp: 'Need help?',
  continue: 'Continue',
  stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
  privacyNotice: 'By continuing you accept our Privacy Notice.',
  privacyNoticeLink: 'Privacy Notice',

  // Waiting
  slowNetwork: 'Slow network. Still trying.',
  tookTooLong: 'That took too long. Check your data and try again.',
  tryAgain: 'Try again',
  offline: 'You are offline. Turn on your data to continue.',

  // Help sheet
  helpTitle: 'Talk to a real person.',
  helpBody: 'We can see which screen you are on.',
  helpWhatsApp: 'Chat on WhatsApp',
  helpCall: 'Call us',
  helpClose: 'Close',

  // ── 1. Identifier ──────────────────────────────────────────────────────
  identifierTitle: (mode: IdentifierMode) =>
    mode === 'phone' ? 'What is your phone number?' : 'What is your email address?',
  identifierLabel: (mode: IdentifierMode) =>
    mode === 'phone' ? 'Your phone number' : 'Your email address',
  identifierPlaceholder: (mode: IdentifierMode) =>
    mode === 'phone' ? '0803 123 4567' : 'chinedu@gmail.com',
  identifierClear: 'Clear',

  trustFree: 'ParkDrop is free.',
  trustDelivery: (mode: IdentifierMode) =>
    mode === 'phone' ? 'We will send you a code by SMS.' : 'We will email you a code.',
  trustPrivacy: (mode: IdentifierMode) =>
    mode === 'phone' ? 'We never sell your number.' : 'We never sell your email.',

  identifierEmpty: (mode: IdentifierMode) =>
    mode === 'phone'
      ? 'Type your phone number to continue.'
      : 'Type your email address to continue.',
  identifierInvalid: (mode: IdentifierMode) =>
    mode === 'phone'
      ? 'Enter your 11-digit number, like 0803 123 4567.'
      : 'Check your email. It should look like name@gmail.com.',

  sendingCode: 'Sending your code…',

  // ── 2. Code ────────────────────────────────────────────────────────────
  codeTitle: 'Enter the code',
  codeSentTo: (mode: IdentifierMode) =>
    mode === 'phone' ? 'We sent a 6-digit code by SMS to' : 'We sent a 6-digit code to',
  codeChange: 'Change',
  codeLabel: 'The 6-digit code',
  codeHint: (mode: IdentifierMode) =>
    mode === 'phone'
      ? 'The SMS can take up to a minute.'
      : 'It can take a minute. Check Spam too.',
  openGmail: 'Open Gmail',
  checking: 'Checking…',

  resendTitle: 'Send the code again',
  resendWait: (seconds: number) =>
    `You can ask again in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`,
  resendReadyTitle: 'No code yet? Send it again',
  resendButton: 'Send again',

  stillNoCode: 'Still no code?',
  codeOnWhatsApp: 'Get the code on WhatsApp',
  codeByCall: 'Call me with the code',

  codeWrong: (mode: IdentifierMode) =>
    mode === 'phone'
      ? 'That code is not right. Check the SMS and try again.'
      : 'That code is not right. Check your email and try again.',
  codeShort: (mode: IdentifierMode) =>
    mode === 'phone' ? 'Type all 6 numbers from the SMS.' : 'Type all 6 numbers from the email.',

  // ── 3. Name ────────────────────────────────────────────────────────────
  nameTitle: 'What should we call you?',
  nameSubtitle: 'Just your first name is fine.',
  nameLabel: 'Your first name',
  namePlaceholder: 'Chinedu',
  nameEmpty: 'Type your first name.',

  // ── 4. PIN ─────────────────────────────────────────────────────────────
  pinTitle: 'Choose a PIN',
  pinSubtitle: '4 numbers you will remember. You use it to open ParkDrop on this phone.',
  pinAtmWarning: 'This PIN is only for ParkDrop. Do not use your ATM PIN.',
  pinConfirmTitle: 'Type it again',
  pinConfirmSubtitle: 'Type the same 4 numbers.',
  pinTooEasy: 'That PIN is too easy to guess. Try another.',
  pinMismatch: 'The two PINs are not the same. Try again.',
  pinDelete: 'Delete',
  pinPadLabel: 'Number keypad',

  // ── 5. Pickup point ────────────────────────────────────────────────────
  pickupTitle: 'Your pickup point',
  pickupSubtitle: 'Your customers see these names in their SMS.',
  pickupNameLabel: 'Name of your pickup point',
  pickupNamePlaceholder: 'Chima Parcel Services',
  parkNameLabel: 'Name of the park',
  parkNamePlaceholder: 'Peace Park',
  smsPreviewTitle: 'Your customers will get this SMS:',
  pickupSave: 'Save and continue',
  saving: 'Saving…',

  pickupNameEmpty: 'Type the name of your pickup point.',
  parkNameEmpty: 'Type the name of the park.',
  pickupTooLong: 'These names are a bit long. Shorten them so your customers get one SMS.',
  pickupOddCharacters:
    'Phones cannot send those characters in an SMS. Please use normal letters and numbers.',
  pickupPlaceholderName: 'That is the example name. Type the real name your customers know.',

  // ── 6. Ready ───────────────────────────────────────────────────────────
  readyTitle: (name: string) => `You are ready, ${name}.`,
  readySubtitle: 'Your pickup point is set up.',
  readyPickupLabel: 'Your pickup point',
  readyEdit: 'Edit',
  installTitle: 'Put ParkDrop on your phone screen',
  installSubtitle: 'So it opens in one tap.',
  installAction: 'Show me how',
  readyPrimary: 'Add your first package',

  // ── 7. Returning user ──────────────────────────────────────────────────
  welcomeBack: (name: string) => `Welcome back, ${name}`,
  unlockSubtitle: 'Type your PIN to open ParkDrop.',
  forgotPin: 'Forgot PIN?',
  notYou: 'Not you?',
  pinWrong: 'That PIN is not right. Try again.',
  pinAttemptsUsed: 'For your safety, type the code we sent you instead.',

  resetPinTitle: 'Reset your PIN',
  newPinTitle: 'Choose a new PIN',
  newPinSubtitle: '4 numbers you will remember.',
} as const;
