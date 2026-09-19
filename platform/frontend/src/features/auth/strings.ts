export const AuthStrings = {
  // Common
  continue: "Continue",
  back: "Back",
  needHelp: "Need Help?",
  processing: "Processing...",
  problemLoggingIn: "Problem logging in?",
  
  // Email Screen
  emailTitle: "Welcome to ParkDrop",
  emailSubtitle: "Enter your email to sign in or create an account.",
  emailLabel: "Email address",
  emailPlaceholder: "name@company.com",
  invalidEmail: "Please enter a valid email address",
  
  // Code Screen
  codeTitle: "Enter confirmation code",
  codeSubtitle: (email: string) => `We sent a 6-digit code to ${email}`,
  resendCode: "Resend code",
  resendCountdown: (seconds: number) => `Resend in ${seconds}s`,
  invalidCode: "The code you entered is incorrect or has expired.",

  // Reauth Screen
  reauthTitle: (name?: string) => name ? `Welcome back, ${name}` : "Welcome back",
  reauthSubtitle: (email: string) => `Continue with ${email}`,
  useDifferentEmail: "Use a different email",
  
  // Name Screen
  nameTitle: "What should we call you?",
  nameSubtitle: "This will be used for your business profile.",
  firstNameLabel: "First Name",
  firstNamePlaceholder: "e.g. Idris",
  
  // PIN Setup Screen
  pinSetupTitle: "Set up a quick PIN",
  pinSetupSubtitle: "You'll use this to quickly unlock ParkDrop on this device.",
  pinConfirmTitle: "Confirm your PIN",
  pinConfirmSubtitle: "Enter your PIN one more time to be sure.",
  pinMismatch: "PINs do not match. Try again.",
  
  // Pickup Point Screen
  pickupPointTitle: "Where are packages dropped off?",
  pickupPointSubtitle: "Give this location a clear name so customers know where to go.",
  pickupPointLabel: "Drop-off Location Name",
  pickupPointPlaceholder: "e.g. Main Gate, Shop 4",
  parkNameLabel: "Park / Complex Name (Optional)",
  parkNamePlaceholder: "e.g. Ikeja City Mall",
  smsPreviewTitle: "This is what customers will see in their SMS:",
  smsPreviewText: (name: string, location: string, park: string) => 
    `ParkDrop: A package has arrived for you at ${name}'s Business (${location}${park ? ', ' + park : ''}).`,

  // Ready Screen
  readyTitle: "You're all set",
  readySubtitle: "We've added 20 free SMS credits to your wallet. You can start receiving packages immediately.",
  goToHome: "Go to Dashboard",
  
  // Unlock Screen
  unlockTitle: (name: string) => `Welcome back, ${name}`,
  unlockSubtitle: "Enter your 4-digit PIN to unlock",
  forgotPin: "Forgot PIN?",
  incorrectPin: "Incorrect PIN. Try again.",
} as const;
