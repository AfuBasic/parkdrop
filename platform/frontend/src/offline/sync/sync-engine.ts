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

    // Apply any known aliases to the pending payloads before sending
    const aliases = await db.entityAliases.toArray();
    const aliasMap = new Map(aliases.map(a => [a.local_id, a.canonical_id]));

    const mappedPending = pending.map(m => {
      if (aliasMap.size === 0) return m;
      
      const payloadString = JSON.stringify(m.payload);
      let replaced = payloadString;
      
      for (const [localId, canonicalId] of aliasMap.entries()) {
        if (replaced.includes(localId)) {
          // Simple string replacement for UUIDs in payload
          // In a production scenario, you might want more precise path-based replacement
          replaced = replaced.split(localId).join(canonicalId);
        }
      }
      
      return {
        ...m,
        payload: JSON.parse(replaced)
      };
    });

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
          mutations: mappedPending.map(m => ({
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
        // If the server tells us it reconciled a duplicate entity, record the alias
        if (result.status === 'APPLIED' && result.metadata?.reconciled && result.metadata?.canonical_id) {
          const originalMutation = pending.find(m => m.mutation_id === result.mutation_id);
          if (originalMutation && originalMutation.operation === 'CREATE_CUSTOMER') {
            const localId = originalMutation.payload.customer_id as string;
            const canonicalId = result.metadata.canonical_id;
            
            if (localId && localId !== canonicalId) {
              await db.entityAliases.put({
                local_id: localId,
                canonical_id: canonicalId,
                entity_type: 'customer',
                resolved_at: new Date().toISOString()
              });
              
              // Also update the local customer record's ID
              const customer = await db.customers.get(localId);
              if (customer) {
                await db.customers.delete(localId);
                customer.id = canonicalId;
                await db.customers.put(customer);
              }
            }
          }
        }

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
      for (const change of changes) {
        try {
          if (change.entity_type === 'sms_wallet' && change.payload) {
            await db.smsWallets.put(change.payload);
          } else if (change.entity_type === 'sms_credit_transaction' && change.payload) {
            await db.smsCreditTransactions.put(change.payload);
          } else if (change.entity_type === 'package' && change.payload) {
            await db.packages.put({
              ...change.payload,
              sync_status: 'SYNCED',
            });
          } else if (change.entity_type === 'customer' && change.payload) {
            await db.customers.put({
              ...change.payload,
              sync_status: 'SYNCED',
            });
          }
        } catch (err) {
          console.error(`[SyncEngine] Failed to apply change ${change.id}:`, err);
        }
      }
      
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
