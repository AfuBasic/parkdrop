/**
 * User-facing copy for the Packages list and Package details screens.
 *
 * Rules:
 *  - Sentence case. Plain words. Grade 5 reading level.
 *  - "Package", never "parcel", "item", or "consignment".
 *  - Never jargon: no "entity", "submit", "validate", "sync", "record", "local", "void".
 *  - Blame-free errors that clearly explain the fix.
 */
export const PackagesStrings = {
  // ── List Header & Search ─────────────────────────────────────────────────
  title: 'Packages',
  searchPlaceholder: 'Name, phone or code',
  searchingCaption: 'Searching all packages',
  clearSearch: 'Clear search',
  noSearchResultsTitle: 'Nothing found.',
  noSearchResultsBody: 'Check the number, or add a new package.',
  addPackageAction: 'Add package',

  // ── Status Tabs ──────────────────────────────────────────────────────────
  tabWaiting: 'Waiting',
  tabCollected: 'Collected',
  tabOther: 'Other',

  // Secondary chips for Other tab
  chipReturned: 'Returned',
  chipCancelled: 'Cancelled',

  // ── Filter Chips ─────────────────────────────────────────────────────────
  // Waiting tab chips
  chipUnpaid: 'Unpaid',
  chipAge3d: '3+ days',
  chipAge7d: '7+ days',

  // Collected tab chips
  chipToday: 'Today',
  chipThisWeek: 'This week',
  chipOwing: 'Owing',

  // ── Summary Line & Sort ──────────────────────────────────────────────────
  clearFilters: 'Clear',
  sortOldestFirst: 'Oldest first',
  sortNewestFirst: 'Newest first',
  sortHighestAmount: 'Highest amount',
  sortTitle: 'Sort packages',
  overdue24hSummary: (count: number) =>
    `Overdue 24+ hours, oldest first · ${count} ${count === 1 ? 'package' : 'packages'}`,

  // ── Age Group Headers ────────────────────────────────────────────────────
  group7DaysOrMore: '7 days or more',
  group3To6Days: '3 to 6 days',
  groupTodayAndYesterday: 'Today and yesterday',
  groupToday: 'Today',
  groupYesterday: 'Yesterday',

  // ── Row Labels & Payment Chips ───────────────────────────────────────────
  paymentUnpaid: 'Unpaid',
  paymentPartPaid: 'Part paid',
  paymentPaid: 'Paid',
  paymentNothingToPay: 'Nothing to pay',
  waitingToSend: 'Waiting to send',
  ageToday: 'Today',
  ageYesterday: 'Yesterday',
  ageDays: (count: number) => `${count} days`,

  // ── Empty States ─────────────────────────────────────────────────────────
  emptyNoUnpaid: 'No unpaid packages. Everyone has paid.',
  emptyNo7Days: 'Nothing has waited 7 days or more.',
  emptyNo24hOverdue: 'Nothing has waited 24 hours or more.',
  emptyNoPackagesYet: 'No packages here yet.',
  loadError: 'Could not load your packages. Tap Try again.',
  retryAction: 'Try again',
  showMorePackages: 'Show 30 more',

  // ── Detail Screen ────────────────────────────────────────────────────────
  detailTitle: 'Package details',
  backAction: 'Back',
  moreActions: 'More',
  callAction: 'Call',
  whatsappAction: 'WhatsApp',
  pickupCodeTitle: 'Customer’s pickup code',
  pickupCodeCaption: 'Ask the customer to show this code.',
  
  // Payment card
  paymentCardTitle: 'Payment',
  amountLabel: 'Amount',
  paidLabel: 'Paid',
  balanceLabel: 'Balance',
  recordPaymentAction: 'Record payment',
  recordPaymentTitle: 'Record payment',
  fullBalanceChip: (amountStr: string) => `Full balance ${amountStr}`,
  partPaymentOption: 'Part payment',
  recordAmountButton: (amountStr: string) => `Record ${amountStr}`,
  paymentRecordedToast: 'Payment recorded',
  paymentHistoryTitle: 'Payment history',

  // Photo card
  photoCardTitle: 'Photo',
  addPhotoAction: 'Add photo',
  retakePhotoAction: 'Retake',
  removePhotoAction: 'Remove',
  photoAddedStatus: 'Photo attached',
  photoUploadingStatus: 'Uploading…',
  photoFailedStatus: "Couldn't upload",
  photoRetryUploadAction: 'Retry upload',
  photoUnavailableNotice: "Photo saved on this device — couldn't load a preview yet.",

  // Activity section
  activityTitle: 'Activity',
  seeAllActivity: 'See all',
  receivedActivity: (time: string, actor: string) => `Received ${time} by ${actor}`,
  releasedActivity: (time: string, actor: string) => `Released ${time} by ${actor}`,
  smsSentStatus: 'SMS sent',
  smsSendingStatus: 'Sending SMS…',
  smsFailedStatus: 'SMS not sent. Tap to try again',
  smsOfflineStatus: 'SMS will send when you are online.',

  // Info card
  infoCardTitle: 'Package info',
  receivedDateLabel: 'Received at',
  collectedAtLabel: 'Collected at',
  receivedByLabel: 'Received by',
  releasedByLabel: 'Released by',
  packageIdLabel: 'Package ID',
  pickupPointLabel: 'Pickup point',
  setupRequiredNotice: 'Finish pickup point setup to show the location name.',
  unsyncedNotice: 'Saved on this phone. It sends when you are online.',

  // Sticky action bar
  collectAndReleasePrimary: (_balanceStr?: string) => `Mark as paid and release...`,
  releasePackagePrimary: 'Release package',
  recordPaymentOnlyAction: 'Record payment only',
  // Who released it is never repeated here — it's already the "Released by"
  // row in the Package info card just below this banner, and adding it here
  // too was long enough to wrap the banner onto two lines.
  collectedBanner: (date: string, time: string) => `Released ${date}, ${time}`,
  // The exact time is not always known (a package collected on another
  // device, or before this app tracked the time). Never guess a time.
  collectedBannerNoTime: 'Released',
  owingBanner: (amountStr: string) => `Owing ${amountStr}`,
  undoReleaseAction: 'Undo release',
  returnedBanner: (date: string) => `Returned on ${date}`,
  returnedBannerNoDate: 'Returned',
  cancelledBanner: (date: string) => `Cancelled on ${date}`,
  cancelledBannerNoDate: 'Cancelled',

  // Release Sheet
  releaseTitle: (nameOrPhone: string) => `Release to ${nameOrPhone}?`,
  checkCodePrompt: 'Check the customer’s pickup code',
  balanceDueBanner: (balanceStr: string) => `Balance ${balanceStr}`,
  releaseWithoutPaymentAction: 'Release without payment',
  yesReleaseAction: 'Yes, release',
  notYetAction: 'Not yet',
  packageReleasedToast: (publicId: string) => `Released ${publicId}`,
  undoAction: (seconds: number) => `Undo (${seconds})`,

  // More menu actions
  resendSmsAction: 'Resend arrival SMS',
  markAsReturnedAction: 'Mark as returned to sender',
  cancelEnteredByMistakeAction: 'Cancel this package (entered by mistake)',

  // Resend SMS toasts
  smsResentToast: 'SMS queued to resend',
  smsResendFailedToast: 'Could not resend SMS. Try again.',
};
