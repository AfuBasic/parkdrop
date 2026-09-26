import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';
import { calculatePaymentSummary } from '@/features/payments/domain/payment-summary';
import { accruedAmountDueMinor, calculateFeeBreakdown, DEFAULT_DAILY_STORAGE_FEE_MINOR } from '@/features/payments/domain/storage-fee';
import type { PackageDetailData, PackageDetailActivityItem } from '@/features/packages/detail/package-detail-types';

export interface UsePackageDetailResult {
  data: PackageDetailData | null;
  isLoading: boolean;
  notFound: boolean;
}

export function usePackageDetail(
  packageId: string | undefined,
  businessId: number | null,
  dailyStorageFeeMinor: number = DEFAULT_DAILY_STORAGE_FEE_MINOR
): UsePackageDetailResult {
  const result = useLiveQuery(
    async () => {
      if (!packageId || !businessId) {
        return { data: null, notFound: false };
      }

      const pkg = await db.packages.get(packageId);

      // Verify package existence and multi-tenant scoping
      if (!pkg || pkg.business_id !== businessId) {
        return { data: null, notFound: true };
      }

      // Load customer
      const customer = pkg.customer_id
        ? (await db.customers.get(pkg.customer_id)) || null
        : null;

      // Load package media
      const mediaList = await db.packageMedia
        .where('package_id')
        .equals(packageId)
        .toArray();
      const media = mediaList.find(m => m.business_id === businessId) || null;

      let mediaPreviewUrl: string | null = null;
      if (media?.local_blob) {
        mediaPreviewUrl = URL.createObjectURL(media.local_blob);
      } else if (media?.public_id) {
        // cloud_name is stored on the row from the upload's own authorize
        // response (see media-upload-coordinator.ts) — not a guessed env
        // var, which previously defaulted to a placeholder that didn't
        // match the real Cloudinary account and rendered as a broken
        // image for every synced photo. VITE_CLOUDINARY_CLOUD_NAME is kept
        // only as a fallback for rows synced before this field existed.
        const cloudName = media.cloud_name || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        if (cloudName) {
          mediaPreviewUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_800/${media.public_id}`;
        }
      }

      // Load payments
      const rawPayments = await db.payments
        .where('package_id')
        .equals(packageId)
        .toArray();

      const payments = rawPayments
        .filter(p => p.business_id === businessId)
        .sort((a, b) => {
          const diff = new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime();
          if (diff !== 0) return diff;
          return b.id.localeCompare(a.id);
        });

      const feeBreakdown = calculateFeeBreakdown(pkg, dailyStorageFeeMinor);

      const paymentSummary = calculatePaymentSummary(
        feeBreakdown.totalDueMinor,
        payments
      );

      // Build deterministic activity timeline
      const timeline: PackageDetailActivityItem[] = [];

      // 1. Package recorded
      timeline.push({
        id: `created-${pkg.id}`,
        type: 'PACKAGE_RECORDED',
        title: 'Package recorded',
        description: pkg.public_package_id ? `Assigned ID ${pkg.public_package_id}` : undefined,
        timestamp: pkg.client_created_at || new Date().toISOString(),
        actorName: pkg.creator_name || undefined,
        actorPhone: pkg.creator_phone || undefined,
      });

      // 2. Photo attached
      if (media) {
        timeline.push({
          id: `media-${media.id}`,
          type: 'PHOTO_ATTACHED',
          title: 'Parcel photo captured',
          timestamp: media.created_at || pkg.client_created_at || new Date().toISOString(),
        });
      }

      // 3. Arrival SMS status (truthful — never claims delivered unless Termii confirmed it)
      if (pkg.arrival_sms_status) {
        const smsTimestamp = pkg.arrival_sms_sent_at || pkg.client_created_at || new Date().toISOString();
        type SmsActivityType = PackageDetailActivityItem['type'];
        const smsStatusMap: Record<string, { type: SmsActivityType; title: string; description?: string }> = {
          PENDING: {
            type: 'ARRIVAL_SMS_QUEUED',
            title: 'SMS sending to customer',
            description: 'Waiting for network',
          },
          SENT: {
            type: 'ARRIVAL_SMS_SENT',
            title: 'SMS sent to customer',
            description: 'Waiting for delivery confirmation',
          },
          DELIVERED: {
            type: 'ARRIVAL_SMS_DELIVERED',
            title: 'SMS delivered to customer',
          },
          FAILED: {
            type: 'ARRIVAL_SMS_FAILED',
            title: 'SMS failed to send',
            description: 'Customer was not notified by text',
          },
          UNDELIVERED: {
            type: 'ARRIVAL_SMS_UNDELIVERED',
            title: 'SMS not delivered',
            description: 'Customer\'s phone could not receive the message',
          },
          NEEDS_RECONCILIATION: {
            type: 'ARRIVAL_SMS_NEEDS_RECONCILIATION',
            title: 'SMS status unknown',
            description: 'Could not confirm if the message was sent',
          },
          SKIPPED_NO_CREDITS: {
            type: 'ARRIVAL_SMS_FAILED',
            title: 'SMS not sent: no credits',
            description: 'Your SMS credits ran out. Top up to notify this customer.',
          },
        };
        const smsEntry = smsStatusMap[pkg.arrival_sms_status];
        if (smsEntry) {
          timeline.push({
            id: `sms-${pkg.id}`,
            ...smsEntry,
            timestamp: smsTimestamp,
          });
        }
      }

      // 4. Payment events
      for (const p of payments) {
        if (p.status === 'COMPLETED') {
          timeline.push({
            id: `pay-${p.id}`,
            type: 'PAYMENT_RECORDED',
            title: `Payment recorded (₦${(p.amount_minor / 100).toLocaleString()})`,
            description: `Via ${p.method}`,
            timestamp: p.recorded_at,
            actorName: p.recorded_by_user_name || undefined,
          });
        } else if (p.status === 'REVERSED') {
          timeline.push({
            id: `pay-rev-${p.id}`,
            type: 'PAYMENT_REVERSED',
            title: `Payment reversed (₦${(Math.abs(p.amount_minor) / 100).toLocaleString()})`,
            description: p.reversal_reason || undefined,
            timestamp: p.recorded_at,
          });
        }
      }

      // 4. Lifecycle Terminal Events
      if (pkg.status === 'RETURNED' && pkg.returned_at) {
        timeline.push({
          id: `return-${pkg.id}`,
          type: 'PACKAGE_RETURNED',
          title: 'Package returned',
          description: pkg.terminal_reason ? `Reason: ${pkg.terminal_reason.replace(/_/g, ' ')}${pkg.terminal_reason_note ? ` (${pkg.terminal_reason_note})` : ''}` : undefined,
          timestamp: pkg.returned_at,
          actorName: pkg.terminal_actor_name || undefined,
          actorPhone: pkg.terminal_actor_phone || undefined,
        });
      } else if (pkg.status === 'CANCELLED' && pkg.cancelled_at) {
        timeline.push({
          id: `cancel-${pkg.id}`,
          type: 'PACKAGE_CANCELLED',
          title: 'Package cancelled',
          description: pkg.terminal_reason ? `Reason: ${pkg.terminal_reason.replace(/_/g, ' ')}${pkg.terminal_reason_note ? ` (${pkg.terminal_reason_note})` : ''}` : undefined,
          timestamp: pkg.cancelled_at,
          actorName: pkg.terminal_actor_name || undefined,
          actorPhone: pkg.terminal_actor_phone || undefined,
        });
      }



      // Sort timeline newest first
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const data: PackageDetailData = {
        package: pkg,
        customer,
        media,
        mediaPreviewUrl,
        payments,
        paymentSummary,
        feeBreakdown,
        activityTimeline: timeline,
      };

      return { data, notFound: false };
    },
    [packageId, businessId, dailyStorageFeeMinor]
  );

  return {
    data: result?.data ?? null,
    isLoading: result === undefined,
    notFound: result?.notFound ?? false,
  };
}
