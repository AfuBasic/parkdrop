import { db } from '@/offline/db/database';
import { MutationQueue } from '@/offline/mutations/mutation-queue';
import type { LocalPayment, PaymentMethod } from '@/offline/db/schema';
import { calculatePaymentSummary, type PaymentSummaryData } from '@/features/payments/domain/payment-summary';

export interface RecordPaymentInput {
  businessId: number;
  pickupPointId: number | null;
  packageId: string;
  amountMinor: number;
  method: PaymentMethod;
  recordedByUserId?: number | null;
  recordedByUserName?: string | null;
  clientRecordedAt?: string;
}

export class PaymentRepository {
  /**
   * Records a payment locally in an atomic Dexie transaction:
   * 1. Inserts the LocalPayment with PENDING_CREATE sync_status.
   * 2. Queues the RECORD_PAYMENT mutation.
   * Updates are immediately observable via useLiveQuery.
   */
  static async recordPayment(input: RecordPaymentInput): Promise<LocalPayment> {
    const paymentId = crypto.randomUUID();
    const now = input.clientRecordedAt || new Date().toISOString();

    const localPayment: LocalPayment = {
      id: paymentId,
      business_id: input.businessId,
      package_id: input.packageId,
      amount_minor: Math.floor(input.amountMinor),
      method: input.method,
      recorded_by_user_id: input.recordedByUserId ?? null,
      recorded_by_user_name: input.recordedByUserName ?? null,
      recorded_at: now,
      client_recorded_at: now,
      status: 'COMPLETED',
      sync_status: 'PENDING_CREATE',
      version: 1,
    };

    await db.transaction('rw', db.payments, db.mutations, async () => {
      // 1. Save payment row
      await db.payments.put(localPayment);

      // 2. Queue mutation
      await MutationQueue.enqueue(
        input.businessId,
        'RECORD_PAYMENT',
        {
          payment_id: paymentId,
          package_id: input.packageId,
          amount_minor: localPayment.amount_minor,
          method: localPayment.method,
          client_recorded_at: now,
        },
        input.pickupPointId,
        paymentId,
        1
      );
    });

    return localPayment;
  }

  /**
   * Fetches all payments for a package sorted deterministically (newest first).
   */
  static async getByPackageId(businessId: number, packageId: string): Promise<LocalPayment[]> {
    const records = await db.payments
      .where('package_id')
      .equals(packageId)
      .toArray();

    return records
      .filter(p => p.business_id === businessId)
      .sort((a, b) => {
        const timeDiff = new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime();
        if (timeDiff !== 0) return timeDiff;
        return b.id.localeCompare(a.id);
      });
  }

  /**
   * Derives current payment summary for a given package and its amount due.
   */
  static async getSummary(businessId: number, packageId: string, amountDueMinor: number): Promise<PaymentSummaryData> {
    const payments = await this.getByPackageId(businessId, packageId);
    return calculatePaymentSummary(amountDueMinor, payments);
  }
}
