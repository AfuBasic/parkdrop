import { db } from '../db/database';
import { MutationQueue } from '../mutations/mutation-queue';
import { generatePublicPackageId, generatePickupCode } from '../../features/packages/domain/PackageCodeGenerator';
import type { LocalPackage } from '../db/schema';

export class PackageRepository {
  /**
   * Creates a package locally and queues the CREATE_PACKAGE mutation.
   * If sendSms is true, it queues an arrival SMS intent flag in the payload.
   */
  static async createLocal(
    businessId: number,
    pickupPointId: number | null,
    customerId: string,
    amountDueMinor: number,
    sendSms: boolean
  ): Promise<LocalPackage> {
    const packageId = crypto.randomUUID();
    const publicPackageId = generatePublicPackageId();
    const pickupCode = generatePickupCode();
    const now = new Date().toISOString();

    const localPackage: LocalPackage = {
      id: packageId,
      business_id: businessId,
      pickup_point_id: pickupPointId,
      customer_id: customerId,
      public_package_id: publicPackageId,
      pickup_code: pickupCode,
      amount_due_minor: amountDueMinor,
      status: 'WAITING',
      client_created_at: now,
      server_received_at: null,
      version: 1,
      sync_status: 'PENDING_CREATE',
    };

    return db.transaction('rw', db.packages, db.mutations, async () => {
      // 1. Save local record
      await db.packages.add(localPackage);

      // 2. Queue mutation
      const payload: Record<string, unknown> = {
        package_id: packageId,
        customer_id: customerId,
        public_package_id: publicPackageId,
        pickup_code: pickupCode,
        amount_due_minor: amountDueMinor,
        client_created_at: now,
        arrival_sms_requested: sendSms,
      };

      if (pickupPointId) {
        payload.pickup_point_id = pickupPointId;
      }

      await MutationQueue.enqueue(
        businessId,
        'CREATE_PACKAGE',
        payload,
        pickupPointId,
        packageId,
        null
      );

      return localPackage;
    });
  }

  static async getWaitingCount(businessId: number, pickupPointId: number | null): Promise<number> {
    if (pickupPointId) {
      return db.packages
        .where('[business_id+pickup_point_id+status]')
        .equals([businessId, pickupPointId, 'WAITING'])
        .count();
    }
    return db.packages
      .where('[business_id+status]')
      .equals([businessId, 'WAITING'])
      .count();
  }

  static async getRecent(businessId: number, limit = 10): Promise<LocalPackage[]> {
    return db.packages
      .where('business_id')
      .equals(businessId)
      .reverse() // Requires indexing or sort (we have index on business_id)
      // Actually we have [business_id+created_at] but dexie might need sortBy
      .sortBy('client_created_at')
      .then(arr => arr.reverse().slice(0, limit));
  }
}
