import { db } from '../db/database';
import { MutationQueue } from '../mutations/mutation-queue';
import { connectivityManager } from './connectivity-manager';
import { getDeviceUuid } from '../device/device-identity';

export class SyncEngine {
  private static isSyncing = false;

  static async sync(businessId: number): Promise<void> {
    if (this.isSyncing) return;
    
    // In a real multi-tab app, we'd use navigator.locks.request('parkdrop-sync', ...)
    
    this.isSyncing = true;
    try {
      const isReachable = await connectivityManager.checkReachability();
      if (!isReachable) return;

      // 1. PUSH
      await this.pushMutations(businessId);
      
      // 2. PULL
      await this.pullChanges(businessId);

    } finally {
      this.isSyncing = false;
    }
  }

  private static async pushMutations(businessId: number): Promise<void> {
    const pending = await MutationQueue.getPending(businessId, 50);
    if (pending.length === 0) return;

    const mutationIds = pending.map(m => m.mutation_id);
    await MutationQueue.markSyncing(mutationIds);

    const deviceUuid = getDeviceUuid();

    try {
      const response = await fetch('/api/v1/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          device_uuid: deviceUuid,
          mutations: pending.map(m => ({
            mutation_id: m.mutation_id,
            operation: m.operation,
            payload: m.payload,
            device_sequence: m.device_sequence,
            pickup_point_id: m.pickup_point_id,
          }))
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Handled by auth layer interceptors usually, but we should back off.
          throw new Error('Unauthorized');
        }
        throw new Error('Push failed');
      }

      const data = await response.json();
      const results = data.results || [];

      for (const result of results) {
        await MutationQueue.resolveResult(result.mutation_id, result.status, result.metadata?.error);
      }

    } catch (e) {
      // Revert SYNCING back to RETRYABLE
      for (const mId of mutationIds) {
        await MutationQueue.resolveResult(mId, 'RETRYABLE', e instanceof Error ? e.message : 'Network error');
      }
    }
  }

  private static async pullChanges(businessId: number): Promise<void> {
    let syncState = await db.syncState.get(businessId);
    if (!syncState) {
      syncState = { business_id: businessId, last_sync_cursor: 0, last_successful_sync_at: null };
      await db.syncState.put(syncState);
    }

    let hasMore = true;
    let currentCursor = syncState.last_sync_cursor;

    while (hasMore) {
      const response = await fetch(`/api/v1/sync/pull?cursor=${currentCursor}&limit=100`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) break;

      const data = await response.json();
      const changes = data.changes || [];
      if (changes.length > 0) {
        console.log(`[SyncEngine] Received ${changes.length} changes from server`);
      }
      
      // Apply changes transactionally here in a real implementation
      // e.g., using a handler registry for entity types
      
      currentCursor = data.cursor;
      hasMore = data.has_more;

      // Advance cursor
      await db.syncState.update(businessId, { 
        last_sync_cursor: currentCursor,
        last_successful_sync_at: new Date().toISOString()
      });
    }
  }
}
