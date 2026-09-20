import { db } from '../db/database';
import { MutationQueue } from '../mutations/mutation-queue';
import { generatePublicPackageId, generatePickupCode } from '../../features/packages/domain/PackageCodeGenerator';
import type { LocalPackage, LocalPackageMedia } from '../db/schema';

export class PackageRepository {
  /**
   * Creates a package locally and queues the CREATE_PACKAGE mutation.
   * If sendSms is true, it queues an arrival SMS intent flag in the payload.
   * If photoBlob is provided, it creates a LocalPackageMedia.
   */
  static async createLocal(
    businessId: number,
    pickupPointId: number | null,
    customerId: string,
    amountDueMinor: number,
    sendSms: boolean,
    photoBlob: Blob | null = null
  ): Promise<{ package: LocalPackage; media: LocalPackageMedia | null }> {
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

    let localMedia: LocalPackageMedia | null = null;
    
    if (photoBlob) {
      localMedia = {
        id: crypto.randomUUID(),
        business_id: businessId,
        package_id: packageId,
        local_blob: photoBlob,
        status: 'PENDING_UPLOAD', // It's ready to upload once package is synced
        attempt_count: 0,
        created_at: now,
      };
    }

    await db.transaction('rw', db.packages, db.mutations, db.packageMedia, async () => {
      // 1. Save local record
      await db.packages.add(localPackage);

      // 1.5 Save local media if exists
      if (localMedia) {
        await db.packageMedia.add(localMedia);
      }

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
    });

    return { package: localPackage, media: localMedia };
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

  /**
   * Returns exact package counts for all canonical statuses scoped to active business/pickup-point.
   */
  static async countByStatus(
    businessId: number,
    pickupPointId: number | null
  ): Promise<{ WAITING: number; COLLECTED: number; RETURNED: number; CANCELLED: number }> {
    if (pickupPointId) {
      const [waiting, collected, returned, cancelled] = await Promise.all([
        db.packages.where('[business_id+pickup_point_id+status]').equals([businessId, pickupPointId, 'WAITING']).count(),
        db.packages.where('[business_id+pickup_point_id+status]').equals([businessId, pickupPointId, 'COLLECTED']).count(),
        db.packages.where('[business_id+pickup_point_id+status]').equals([businessId, pickupPointId, 'RETURNED']).count(),
        db.packages.where('[business_id+pickup_point_id+status]').equals([businessId, pickupPointId, 'CANCELLED']).count(),
      ]);
      return { WAITING: waiting, COLLECTED: collected, RETURNED: returned, CANCELLED: cancelled };
    }

    const [waiting, collected, returned, cancelled] = await Promise.all([
      db.packages.where('[business_id+status]').equals([businessId, 'WAITING']).count(),
      db.packages.where('[business_id+status]').equals([businessId, 'COLLECTED']).count(),
      db.packages.where('[business_id+status]').equals([businessId, 'RETURNED']).count(),
      db.packages.where('[business_id+status]').equals([businessId, 'CANCELLED']).count(),
    ]);
    return { WAITING: waiting, COLLECTED: collected, RETURNED: returned, CANCELLED: cancelled };
  }

  /**
   * Retrieves paginated packages filtered by status, sorted by client_created_at desc, joined with customer details.
   */
  static async listByStatus(
    businessId: number,
    pickupPointId: number | null,
    status: LocalPackage['status'],
    limit = 30,
    offset = 0
  ): Promise<Array<LocalPackage & { customer_name: string; customer_phone: string }>> {
    let pkgs: LocalPackage[];

    if (pickupPointId) {
      pkgs = await db.packages
        .where('[business_id+pickup_point_id+status]')
        .equals([businessId, pickupPointId, status])
        .toArray();
    } else {
      pkgs = await db.packages
        .where('[business_id+status]')
        .equals([businessId, status])
        .toArray();
    }

    // Deterministic sort by client_created_at desc, with id tie-breaker
    pkgs.sort((a, b) => {
      const diff = new Date(b.client_created_at).getTime() - new Date(a.client_created_at).getTime();
      if (diff !== 0) return diff;
      return b.id.localeCompare(a.id);
    });

    const page = pkgs.slice(offset, offset + limit);

    // Batch load customer details
    const customerIds = Array.from(new Set(page.map(p => p.customer_id)));
    const customers = await db.customers.where('id').anyOf(customerIds).toArray();
    const customerMap = new Map(customers.map(c => [c.id, c]));

    return page.map(p => {
      const customer = customerMap.get(p.customer_id);
      return {
        ...p,
        customer_name: customer?.name || 'Unknown Customer',
        customer_phone: customer?.phone_display || 'Unknown Phone',
      };
    });
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
