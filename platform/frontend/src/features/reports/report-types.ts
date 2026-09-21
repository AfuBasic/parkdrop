export interface DailyPackageMetrics {
  receivedCount: number;
  collectedCount: number;
  returnedCount: number;
  cancelledCount: number;
  waitingNowCount: number | null; // Only available for Today
}

export interface DailyPaymentMethodBreakdown {
  cashMinor: number;
  transferMinor: number;
  posMinor: number;
  otherMinor: number;
}

export interface DailyPaymentMetrics {
  recordedCount: number;
  recordedMinor: number;
  reversedCount: number;
  reversedMinor: number;
  netMinor: number;
  byMethod: DailyPaymentMethodBreakdown;
}

export interface ReportScopeState {
  type: 'all' | 'pickup_point';
  pickupPointId: number | null;
  pickupPointName?: string | null;
}

export type OperationalEventType =
  | 'PACKAGE_RECEIVED'
  | 'PAYMENT_RECORDED'
  | 'PAYMENT_REVERSED'
  | 'PACKAGE_COLLECTED'
  | 'PACKAGE_RETURNED'
  | 'PACKAGE_CANCELLED';

export interface DailyOperationalEventItem {
  id: string;
  type: OperationalEventType;
  eventTime: string;
  packageId?: string | null;
  publicPackageId?: string | null;
  customerName?: string | null;
  pickupPointId?: number | null;
  pickupPointName?: string | null;
  amountMinor?: number | null;
  paymentMethod?: string | null;
  actorName: string;
  details?: string | null;
}

export type ReportCompletenessState =
  | 'UP_TO_DATE'
  | 'OFFLINE_LOCAL'
  | 'HISTORICAL_SERVER'
  | 'HISTORICAL_UNAVAILABLE_OFFLINE';

export interface DailyOperationsSummary {
  date: string; // YYYY-MM-DD
  timezone: string;
  scope: ReportScopeState;
  packages: DailyPackageMetrics;
  payments: DailyPaymentMetrics;
  generatedAt: string;
  completeness: ReportCompletenessState;
}
