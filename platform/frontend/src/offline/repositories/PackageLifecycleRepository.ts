import { db } from '@/offline/db/database';
import { MutationQueue } from '@/offline/mutations/mutation-queue';
import type { LocalPackage } from '@/offline/db/schema';
import type { ReturnReason, CancelReason } from '@/features/packages/lifecycle/domain/lifecycle-reasons';

export interface ReturnPackageLocalParams {
  businessId: number;
  pickupPointId: number | null;
  packageId: string;
  reason: ReturnReason;
  reasonNote?: string | null;
  actorName?: string | null;
}

export interface CancelPackageLocalParams {
  businessId: number;
  pickupPointId: number | null;
  packageId: string;
  reason: CancelReason;
  reasonNote?: string | null;
  actorName?: string | null;
}

export interface CollectPackageLocalParams {
  businessId: number;
  pickupPointId: number | null;
  packageId: string;
  pickupCode?: string;
  notes?: string | null;
  actorName?: string | null;
}

export class PackageLifecycleRepository {
  /**
   * Atomically mark a local package as RETURNED and enqueue RETURN_PACKAGE mutation.
   */
  static async returnPackageLocally(params: ReturnPackageLocalParams): Promise<LocalPackage> {
    const { businessId, pickupPointId, packageId, reason, reasonNote, actorName } = params;
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    return db.transaction('rw', db.packages, db.mutations, async () => {
      const existing = await db.packages.get(packageId);

      if (!existing || existing.business_id !== businessId) {
        throw new Error('PACKAGE_NOT_FOUND');
      }

      if (existing.status !== 'WAITING') {
        throw new Error(`PACKAGE_NOT_WAITING: Current status is ${existing.status}`);
      }

      if (reason === 'OTHER' && (!reasonNote || reasonNote.trim() === '')) {
        throw new Error('REASON_NOTE_REQUIRED_FOR_OTHER');
      }

      const updatedPackage: LocalPackage = {
        ...existing,
        status: 'RETURNED',
        returned_at: now,
        terminal_reason: reason,
        terminal_reason_note: reasonNote ? reasonNote.trim() : null,
        terminal_actor_name: actorName || 'Staff',
      };

      await db.packages.put(updatedPackage);

      await MutationQueue.enqueue(
        businessId,
        'RETURN_PACKAGE',
        {
          event_id: eventId,
          package_id: packageId,
          reason,
          reason_note: reasonNote ? reasonNote.trim() : null,
          client_event_at: now,
        },
        pickupPointId,
        packageId,
        existing.version
      );

      return updatedPackage;
    });
  }

  /**
   * Atomically mark a local package as CANCELLED and enqueue CANCEL_PACKAGE mutation.
   */
  static async cancelPackageLocally(params: CancelPackageLocalParams): Promise<LocalPackage> {
    const { businessId, pickupPointId, packageId, reason, reasonNote, actorName } = params;
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    return db.transaction('rw', db.packages, db.mutations, async () => {
      const existing = await db.packages.get(packageId);

      if (!existing || existing.business_id !== businessId) {
        throw new Error('PACKAGE_NOT_FOUND');
      }

      if (existing.status !== 'WAITING') {
        throw new Error(`PACKAGE_NOT_WAITING: Current status is ${existing.status}`);
      }

      if (reason === 'OTHER' && (!reasonNote || reasonNote.trim() === '')) {
        throw new Error('REASON_NOTE_REQUIRED_FOR_OTHER');
      }

      const updatedPackage: LocalPackage = {
        ...existing,
        status: 'CANCELLED',
        cancelled_at: now,
        terminal_reason: reason,
        terminal_reason_note: reasonNote ? reasonNote.trim() : null,
        terminal_actor_name: actorName || 'Staff',
      };

      await db.packages.put(updatedPackage);

      await MutationQueue.enqueue(
        businessId,
        'CANCEL_PACKAGE',
        {
          event_id: eventId,
          package_id: packageId,
          reason,
          reason_note: reasonNote ? reasonNote.trim() : null,
          client_event_at: now,
        },
        pickupPointId,
        packageId,
        existing.version
      );

      return updatedPackage;
    });
  }

  /**
   * Atomically mark a local package as COLLECTED and enqueue COLLECT_PACKAGE mutation.
   */
  static async collectPackageLocally(params: CollectPackageLocalParams): Promise<LocalPackage> {
    const { businessId, pickupPointId, packageId, pickupCode, notes, actorName } = params;
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    return db.transaction('rw', db.packages, db.mutations, async () => {
      const existing = await db.packages.get(packageId);

      if (!existing || existing.business_id !== businessId) {
        throw new Error('PACKAGE_NOT_FOUND');
      }

      if (existing.status !== 'WAITING') {
        throw new Error(`PACKAGE_NOT_WAITING: Current status is ${existing.status}`);
      }

      if (pickupCode && existing.pickup_code.toUpperCase().trim() !== pickupCode.toUpperCase().trim()) {
        throw new Error('INVALID_PICKUP_CODE');
      }

      const updatedPackage: LocalPackage = {
        ...existing,
        status: 'COLLECTED',
        terminal_actor_name: actorName || 'Staff',
      };

      await db.packages.put(updatedPackage);

      await MutationQueue.enqueue(
        businessId,
        'COLLECT_PACKAGE',
        {
          event_id: eventId,
          package_id: packageId,
          pickup_code: pickupCode || existing.pickup_code,
          notes: notes ? notes.trim() : null,
          client_event_at: now,
        },
        pickupPointId,
        packageId,
        existing.version
      );

      return updatedPackage;
    });
  }
}
