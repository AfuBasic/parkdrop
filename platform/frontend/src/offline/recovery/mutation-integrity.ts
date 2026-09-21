import { db } from '@/offline/db/database';
import type { LocalMutation, LocalPackage, LocalPayment } from '@/offline/db/schema';

export class MutationIntegrity {
  /**
   * Deep mutation integrity validation.
   * If a CREATE_PACKAGE or RECORD_PAYMENT mutation exists without a corresponding local read model,
   * reconstruct the local table entry from the durable payload so the attendant does not experience missing rows.
   */
  static async verifyAndRepairOrphanedMutations(businessId?: number): Promise<{ repairedPackages: number; repairedPayments: number; quarantined: number }> {
    let repairedPackages = 0;
    let repairedPayments = 0;
    let quarantined = 0;

    let query = db.mutations.where('status').anyOf(['PENDING', 'RETRYABLE']);
    if (businessId) {
      query = db.mutations.where('[business_id+status]').anyOf([[businessId, 'PENDING'], [businessId, 'RETRYABLE']]);
    }

    const mutations = await query.toArray();

    for (const m of mutations) {
      try {
        if (m.operation === 'CREATE_PACKAGE') {
          const payload = m.payload as any;
          const packageId = (m.entity_id || payload?.package_id || payload?.id) as string;

          if (packageId) {
            const existingPkg = await db.packages.get(packageId);
            if (!existingPkg && payload.public_package_id && payload.pickup_code) {
              const reconstructed: LocalPackage = {
                id: packageId,
                business_id: m.business_id,
                pickup_point_id: m.pickup_point_id || payload.pickup_point_id || null,
                customer_id: payload.customer_id || '',
                public_package_id: payload.public_package_id,
                pickup_code: payload.pickup_code,
                amount_due_minor: Number(payload.amount_due_minor) || 0,
                status: (payload.status as any) || 'WAITING',
                client_created_at: payload.client_created_at || m.created_at,
                server_received_at: null,
                version: 1,
                sync_status: 'PENDING_CREATE',
                creator_name: payload.creator_name || null,
                pickup_point_name: payload.pickup_point_name || null,
              };

              await db.packages.put(reconstructed);
              repairedPackages++;
            }
          }
        } else if (m.operation === 'RECORD_PAYMENT') {
          const payload = m.payload as any;
          const paymentId = (m.entity_id || payload?.payment_id || payload?.id) as string;

          if (paymentId) {
            const existingPayment = await db.payments.get(paymentId);
            if (!existingPayment && payload.package_id && payload.amount_minor !== undefined) {
              const reconstructed: LocalPayment = {
                id: paymentId,
                business_id: m.business_id,
                package_id: payload.package_id,
                amount_minor: Number(payload.amount_minor) || 0,
                method: payload.method || 'CASH',
                recorded_by_user_id: payload.recorded_by_user_id || null,
                recorded_by_user_name: payload.recorded_by_user_name || null,
                recorded_by_device_uuid: payload.recorded_by_device_uuid || m.device_uuid,
                recorded_at: payload.recorded_at || m.created_at,
                client_recorded_at: payload.client_recorded_at || m.created_at,
                status: payload.status || 'COMPLETED',
                sync_status: 'PENDING_CREATE',
                version: 1,
              };

              await db.payments.put(reconstructed);
              repairedPayments++;
            }
          }
        }
      } catch (err) {
        console.warn('[MutationIntegrity] Could not inspect mutation:', m.mutation_id, err);
        // Quarantine severely malformed mutation
        await this.quarantineMalformedRecord(m, 'MALFORMED_MUTATION_PAYLOAD');
        quarantined++;
      }
    }

    return { repairedPackages, repairedPayments, quarantined };
  }

  /**
   * Quarantines a malformed local record so it can be inspected without halting normal business operations.
   */
  static async quarantineMalformedRecord(record: LocalMutation | any, reason: string): Promise<void> {
    const id = record.mutation_id || record.id || crypto.randomUUID();
    const businessId = record.business_id ?? null;
    const entityType = record.operation ? 'mutation' : (record.entity_type || 'unknown');

    await db.quarantineRecords.put({
      id: String(id),
      business_id: businessId,
      entity_type: entityType,
      entity_id: record.entity_id || null,
      raw_payload: record,
      reason,
      quarantined_at: new Date().toISOString(),
      resolved_at: null,
    });
  }
}
