/**
 * Every word the Daily operations (Reports) screen says.
 *
 * Same house rules as the other migrated features: sentence case, plain
 * words, no text under the 15px floor.
 *
 * No screen in this feature may hard-code a user-visible string.
 */
export const ReportsStrings = {
  title: 'Daily operations',
  backToSettings: 'Settings',
  restrictedBody: 'Reports are only for owners and managers.',

  exportCsv: 'Export as a file',
  exporting: 'Getting your file ready…',

  today: 'Today',
  showingLocalData: 'Showing what is on this phone',

  loading: 'Getting your report…',
  historicalUnavailableTitle: 'This date is not saved on this phone.',
  historicalUnavailableBody: 'Connect to the internet to see this report.',

  waitingNow: (n: number) => `Waiting now: ${n}`,

  packagesHeading: 'Packages',
  received: 'Received',
  collected: 'Collected',
  returned: 'Returned',
  cancelled: 'Cancelled',

  paymentsHeading: 'Payments',
  paymentsRecorded: 'Payments recorded',
  reversals: 'Reversals',
  netActivity: 'Net payment activity',
  byMethod: 'By method',
  cash: 'Cash',
  transfer: 'Transfer',
  pos: 'POS',
  other: 'Other',

  activityHeading: 'Activity',
  eventsCount: (n: number) => `${n} ${n === 1 ? 'event' : 'events'}`,
  noActivity: 'Nothing happened on this date.',

  allPickupPoints: 'All pickup points',

  eventLabel: {
    PACKAGE_RECEIVED: 'Package received',
    PACKAGE_COLLECTED: 'Package collected',
    PACKAGE_RETURNED: 'Package returned',
    PACKAGE_CANCELLED: 'Package cancelled',
    PAYMENT_RECORDED: 'Payment recorded',
    PAYMENT_REVERSED: 'Payment reversed',
  } as const,
} as const;
