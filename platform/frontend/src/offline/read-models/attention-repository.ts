import { db } from '@/offline/db/database';
import type { AttentionItem } from '@/features/attention/attention-types';
import type { BusinessRole } from '@/features/business/permissions/business-permissions';
import type { LocalPayment, LocalPackageMedia, LocalConflict } from '@/offline/db/schema';

export interface AttentionFilterOptions {
  businessId: number;
  userRole?: BusinessRole | string | null;
  activePurchase?: {
    id: string;
    credits: number;
    amount_minor: number;
    status: string;
    created_at: string;
  } | null;
}

export class AttentionRepository {
  /**
   * Project current unresolved attention items across canonical Dexie domain state:
   * 1. Media upload failures (PackageMedia with FAILED_RETRYABLE or NEEDS_ATTENTION)
   * 2. Payment sync rejections (Payments with sync_status === 'NEEDS_ATTENTION')
   * 3. Sync conflicts (Conflicts with status === 'UNRESOLVED')
   * 4. Wallet credits (balance === 0 or balance < 5)
   * 5. Pending or failed SMS credit purchases
   */
  static async getAttentionItems(options: AttentionFilterOptions): Promise<AttentionItem[]> {
    const { businessId, userRole = 'attendant', activePurchase } = options;
    const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';

    const items: AttentionItem[] = [];

    // ─── 1. Package Media Upload Failures ──────────────────────────────
    const failedMedia = await db.packageMedia
      .where('business_id')
      .equals(businessId)
      .filter((m: LocalPackageMedia) => m.status === 'FAILED_RETRYABLE' || m.status === 'NEEDS_ATTENTION')
      .toArray();

    for (const media of failedMedia) {
      const pkg = await db.packages.get(media.package_id);
      const customer = pkg ? await db.customers.get(pkg.customer_id) : null;

      items.push({
        id: `photo-upload:${media.id}`,
        type: 'PHOTO_UPLOAD_FAILED',
        severity: 'ERROR',
        title: 'A photo did not send.',
        message: customer?.name
          ? `${customer.name}'s package photo is still on this phone.`
          : 'This package photo is still on this phone.',
        entityType: 'package',
        entityId: media.package_id,
        occurredAt: media.last_attempt_at || media.created_at,
        action: {
          type: 'RETRY_PHOTO',
          label: 'Send it again',
          targetId: media.id,
          requiresOnline: true,
        },
        metadata: {
          publicPackageId: pkg?.public_package_id,
          customerName: customer?.name,
        },
      });
    }

    // ─── 2. Rejected Offline Payments ──────────────────────────────────
    const rejectedPayments = await db.payments
      .where('business_id')
      .equals(businessId)
      .filter((p: LocalPayment) => p.sync_status === 'NEEDS_ATTENTION')
      .toArray();

    for (const payment of rejectedPayments) {
      const pkg = await db.packages.get(payment.package_id);
      const customer = pkg ? await db.customers.get(pkg.customer_id) : null;

      items.push({
        id: `payment-rejected:${payment.id}`,
        type: 'PAYMENT_SYNC_REJECTED',
        severity: 'ERROR',
        title: 'A payment was not saved.',
        message: 'The package may already be paid. Open it to see what ParkDrop has.',
        entityType: 'payment',
        entityId: payment.package_id,
        occurredAt: payment.client_recorded_at || payment.recorded_at,
        action: {
          type: 'VIEW_PACKAGE',
          label: 'See the package',
          targetId: payment.package_id,
          requiresOnline: false,
        },
        metadata: {
          publicPackageId: pkg?.public_package_id,
          customerName: customer?.name,
          amountMinor: payment.amount_minor,
        },
      });
    }

    // ─── 3. Sync Conflicts ─────────────────────────────────────────────
    const unresolvedConflicts = await db.conflicts
      .filter((c: LocalConflict) => (!c.business_id || c.business_id === businessId) && c.status === 'UNRESOLVED')
      .toArray();

    for (const conflict of unresolvedConflicts) {
      const pkg = conflict.entity_type === 'package' ? await db.packages.get(conflict.entity_id) : null;
      const customer = pkg ? await db.customers.get(pkg.customer_id) : null;

      const isCollectionConflict =
        conflict.type === 'PACKAGE_ALREADY_COLLECTED' ||
        conflict.server_summary?.current_status === 'COLLECTED';

      items.push({
        id: `sync-conflict:${conflict.conflict_id}`,
        type: isCollectionConflict ? 'COLLECTION_SYNC_CONFLICT' : 'PACKAGE_LIFECYCLE_CONFLICT',
        severity: 'WARNING',
        title: isCollectionConflict
          ? 'This package was collected on another phone.'
          : 'This package changed on another phone.',
        message: isCollectionConflict
          ? 'Another phone collected it first. ParkDrop kept that.'
          : 'Another phone changed it first. ParkDrop kept that.',
        entityType: 'conflict',
        entityId: conflict.entity_id,
        occurredAt: conflict.created_at,
        action: {
          type: 'VIEW_PACKAGE',
          label: 'See the package',
          targetId: conflict.entity_id,
          requiresOnline: false,
        },
        metadata: {
          publicPackageId: pkg?.public_package_id,
          customerName: customer?.name,
        },
      });
    }

    // ─── 4. SMS Credit Wallet State ────────────────────────────────────
    const wallet = await db.smsWallets
      .where('business_id')
      .equals(businessId)
      .first();

    if (wallet) {
      if (wallet.balance === 0) {
        items.push({
          id: `sms-wallet-zero:${businessId}`,
          type: 'ZERO_SMS_CREDITS',
          severity: 'ERROR',
          title: 'You have no SMS credits.',
          message: 'Your customers are not being texted when their packages arrive.',
          entityType: 'wallet',
          entityId: wallet.id,
          occurredAt: wallet.updated_at || new Date().toISOString(),
          action: isOwnerOrManager
            ? {
                type: 'BUY_SMS_CREDITS',
                label: 'Buy SMS credits',
                requiresOnline: true,
              }
            : {
                type: 'VIEW_SMS_CREDITS',
                label: 'See SMS credits',
                requiresOnline: false,
              },
          metadata: {
            credits: 0,
          },
        });
      } else if (wallet.balance < 5) {
        items.push({
          id: `sms-wallet-low:${businessId}`,
          type: 'LOW_SMS_CREDITS',
          severity: 'WARNING',
          title: `You have ${wallet.balance} SMS ${wallet.balance === 1 ? 'credit' : 'credits'} left.`,
          message: 'When they run out, your customers stop being texted.',
          entityType: 'wallet',
          entityId: wallet.id,
          occurredAt: wallet.updated_at || new Date().toISOString(),
          action: isOwnerOrManager
            ? {
                type: 'BUY_SMS_CREDITS',
                label: 'Buy SMS credits',
                requiresOnline: true,
              }
            : {
                type: 'VIEW_SMS_CREDITS',
                label: 'See SMS credits',
                requiresOnline: false,
              },
          metadata: {
            credits: wallet.balance,
          },
        });
      }
    }

    // ─── 5. SMS Credit Purchases in Progress / Unresolved ──────────────
    if (activePurchase) {
      if (activePurchase.status === 'PENDING' || activePurchase.status === 'PROCESSING') {
        items.push({
          id: `purchase-pending:${activePurchase.id}`,
          type: 'SMS_CREDIT_PURCHASE_PENDING',
          severity: 'INFO',
          title: 'We are still checking your payment.',
          message: 'This can take a few minutes. Please do not pay again.',
          entityType: 'purchase',
          entityId: activePurchase.id,
          occurredAt: activePurchase.created_at,
          action: {
            type: 'CHECK_PURCHASE',
            label: 'Check again',
            targetId: activePurchase.id,
            requiresOnline: true,
          },
          metadata: {
            credits: activePurchase.credits,
            amountMinor: activePurchase.amount_minor,
          },
        });
      } else if (activePurchase.status === 'FAILED') {
        items.push({
          id: `purchase-failed:${activePurchase.id}`,
          type: 'SMS_CREDIT_PURCHASE_FAILED',
          severity: 'WARNING',
          title: 'Your payment did not go through.',
          message: 'No credits were added. You can try again.',
          entityType: 'purchase',
          entityId: activePurchase.id,
          occurredAt: activePurchase.created_at,
          action: isOwnerOrManager
            ? {
                type: 'BUY_SMS_CREDITS',
                label: 'Try again',
                requiresOnline: true,
              }
            : undefined,
          metadata: {
            credits: activePurchase.credits,
            amountMinor: activePurchase.amount_minor,
          },
        });
      }
    }

    // ─── Deterministic Sorting ─────────────────────────────────────────
    // Priority order:
    // 1. Direct actionable errors (PHOTO_UPLOAD_FAILED, PAYMENT_SYNC_REJECTED, ZERO_SMS_CREDITS)
    // 2. Warnings (COLLECTION_SYNC_CONFLICT, PACKAGE_LIFECYCLE_CONFLICT, LOW_SMS_CREDITS, SMS_CREDIT_PURCHASE_FAILED)
    // 3. Info (SMS_CREDIT_PURCHASE_PENDING)
    // Then newest occurredAt first
    const severityPriority: Record<string, number> = {
      ERROR: 1,
      WARNING: 2,
      INFO: 3,
    };

    return items.sort((a, b) => {
      const pA = severityPriority[a.severity] ?? 9;
      const pB = severityPriority[b.severity] ?? 9;
      if (pA !== pB) return pA - pB;
      return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
    });
  }

  /**
   * Get the number of unresolved attention items for badge indicators.
   */
  static async getUnresolvedCount(options: AttentionFilterOptions): Promise<number> {
    const items = await this.getAttentionItems(options);
    return items.length;
  }
}
