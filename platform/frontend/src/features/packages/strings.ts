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
  receivedDateLabel: 'Received date and time',
  receivedByLabel: 'Received by',
  packageIdLabel: 'Package ID',
  pickupPointLabel: 'Pickup point',
  setupRequiredNotice: 'Finish pickup point setup to show the location name.',
  unsyncedNotice: 'Saved on this phone. It sends when you are online.',

  // Sticky action bar
  collectAndReleasePrimary: (balanceStr: string) => `Collect ${balanceStr} and release`,
  releasePackagePrimary: 'Release package',
  recordPaymentOnlyAction: 'Record payment only',
  collectedBanner: (date: string, time: string, actor: string) => `Collected on ${date}, ${time} by ${actor}`,
  // The exact time is not always known (a package collected on another
  // device, or before this app tracked the time). Never guess a time.
  collectedBannerNoTime: (actor: string) => `Collected by ${actor}`,
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
  markAsReturnedAction: 'Mark as returned to sender',
  cancelEnteredByMistakeAction: 'Cancel this package (entered by mistake)',
};
