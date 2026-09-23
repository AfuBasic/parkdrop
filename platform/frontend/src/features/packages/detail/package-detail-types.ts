import type { LocalPackage, LocalCustomer, LocalPackageMedia, LocalPayment } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';

export interface PackageDetailActivityItem {
  id: string;
  type:
    | 'PACKAGE_RECORDED'
    | 'PHOTO_ATTACHED'
    | 'ARRIVAL_SMS_QUEUED'
    | 'ARRIVAL_SMS_SENT'
    | 'ARRIVAL_SMS_DELIVERED'
    | 'ARRIVAL_SMS_FAILED'
    | 'ARRIVAL_SMS_UNDELIVERED'
    | 'ARRIVAL_SMS_NEEDS_RECONCILIATION'
    | 'PAYMENT_RECORDED'
    | 'PAYMENT_REVERSED'
    | 'PACKAGE_COLLECTED'
    | 'PACKAGE_RETURNED'
    | 'PACKAGE_CANCELLED'
    | 'SYNCED';
  title: string;
  description?: string;
  timestamp: string;
  actorName?: string;
  actorPhone?: string;
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
