import { db } from '@/offline/db/database';
import { getDeviceUuid, getNextDeviceSequence } from '@/offline/device/device-identity';
import type { LocalMutation } from '@/offline/db/schema';

export class MutationQueue {
  static async enqueue(
    businessId: number,
    operation: string,
    payload: Record<string, unknown>,
    pickupPointId: number | null = null,
    entityId: string | null = null,
    baseVersion: number | null = null
  ): Promise<LocalMutation> {
    const deviceUuid = getDeviceUuid();
    const nextSequence = getNextDeviceSequence();

    const mutation: LocalMutation = {
      mutation_id: crypto.randomUUID(),
      device_uuid: deviceUuid,
      device_sequence: nextSequence,
      business_id: businessId,
      pickup_point_id: pickupPointId,
      operation,
      entity_id: entityId,
      base_version: baseVersion,
      payload,
      created_at: new Date().toISOString(),
      status: 'PENDING',
      attempt_count: 0,
      last_attempt_at: null,
      last_error_code: null,
      last_error_message: null
    };

    await db.mutations.add(mutation);
    return mutation;
  }

  static async getPending(businessId: number, limit = 50): Promise<LocalMutation[]> {
    return await db.mutations
      .where('[business_id+status]')
      .anyOf([[businessId, 'PENDING'], [businessId, 'RETRYABLE']])
      .limit(limit)
      .toArray();
  }

  static async markSyncing(mutationIds: string[]): Promise<void> {
    await db.mutations
      .where('mutation_id')
      .anyOf(mutationIds)
      .modify({ status: 'SYNCING', last_attempt_at: new Date().toISOString() });
  }

  static async resolveResult(mutationId: string, status: string, error?: string): Promise<void> {
    if (status === 'APPLIED') {
      await db.mutations.where('mutation_id').equals(mutationId).delete();
    } else {
      await db.mutations.where('mutation_id').equals(mutationId).modify(m => {
        m.status = status as any;
        m.attempt_count += 1;
        if (error) {
          m.last_error_message = error;
        }
      });
    }
  }
}
