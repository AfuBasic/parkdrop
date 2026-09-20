import type { LocalPackage, LocalCustomer, LocalPackageMedia, LocalPayment } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';

export interface PackageDetailActivityItem {
  id: string;
  type: 'PACKAGE_RECORDED' | 'PHOTO_ATTACHED' | 'ARRIVAL_SMS_QUEUED' | 'ARRIVAL_SMS_SENT' | 'PAYMENT_RECORDED' | 'PAYMENT_REVERSED' | 'SYNCED';
  title: string;
  description?: string;
  timestamp: string;
  actorName?: string;
}

export interface PackageDetailData {
  package: LocalPackage;
  customer: LocalCustomer | null;
  media: LocalPackageMedia | null;
  mediaPreviewUrl: string | null;
  payments: LocalPayment[];
  paymentSummary: PaymentSummaryData;
  activityTimeline: PackageDetailActivityItem[];
}
