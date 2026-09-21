import { db } from '@/offline/db/database';
import { MutationQueue } from '@/offline/mutations/mutation-queue';
import { connectivityManager } from './connectivity-manager';
import { getDeviceUuid } from '@/offline/device/device-identity';
import type { LocalPackage } from '@/offline/db/schema';

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

        const originalMutation = pending.find(m => m.mutation_id === result.mutation_id);

        // Handle RECORD_PAYMENT mutation response
        if (originalMutation && originalMutation.operation === 'RECORD_PAYMENT') {
          const paymentId = originalMutation.payload.payment_id as string;
          if (result.status === 'APPLIED') {
            const existing = await db.payments.get(paymentId);
            if (existing) {
              await db.payments.update(paymentId, {
                sync_status: 'SYNCED',
                sync_error: null,
              });
            }
          } else if (result.status === 'REJECTED') {
            // Payment rejected by server (e.g. overpayment race condition or status forbid)
            const existing = await db.payments.get(paymentId);
            if (existing) {
              await db.payments.update(paymentId, {
                sync_status: 'NEEDS_ATTENTION',
                sync_error: (result.metadata?.user_message as string) || (result.metadata?.error as string) || 'Payment rejected by server',
              });
            }
          }
        }

        // Handle RETURN_PACKAGE and CANCEL_PACKAGE mutation responses
        if (originalMutation && (originalMutation.operation === 'RETURN_PACKAGE' || originalMutation.operation === 'CANCEL_PACKAGE')) {
          const packageId = originalMutation.payload.package_id as string;
          if (result.status === 'APPLIED') {
            const existing = await db.packages.get(packageId);
            if (existing) {
              await db.packages.update(packageId, {
                sync_status: 'SYNCED',
              });
            }
          } else if (result.status === 'CONFLICT') {
            // Reconcile to canonical status if server reports already collected/returned/cancelled
            const canonicalStatus = (result.metadata?.current_status as LocalPackage['status']) || 'COLLECTED';
            const existing = await db.packages.get(packageId);
            if (existing) {
              await db.packages.update(packageId, {
                status: canonicalStatus,
                sync_status: 'SYNCED',
              });
            }

            // Persist LocalConflict record for Attention Center
            await db.conflicts.put({
              conflict_id: crypto.randomUUID(),
              mutation_id: result.mutation_id,
              business_id: businessId,
              entity_type: 'package',
              entity_id: packageId,
              type: (result.metadata?.error as string) || 'LIFECYCLE_CONFLICT',
              local_summary: {
                operation: originalMutation.operation,
                attempted_action: originalMutation.operation === 'RETURN_PACKAGE' ? 'RETURN' : 'CANCEL',
              },
              server_summary: {
                current_status: canonicalStatus,
                message: (result.metadata?.message as string) || `Package was already ${canonicalStatus.toLowerCase()} on another device.`,
              },
              created_at: new Date().toISOString(),
              resolved_at: null,
              status: 'UNRESOLVED',
            });
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
          } else if ((change.entity_type === 'package_media' || change.entity_type === 'packageMedia') && change.payload) {
            const existing = await db.packageMedia.get(change.entity_id);
            await db.packageMedia.put({
              ...existing,
              ...change.payload,
              status: (change.payload.status as any) || 'SYNCED',
              attempt_count: existing?.attempt_count ?? 0,
              created_at: change.payload.created_at || existing?.created_at || new Date().toISOString(),
            });
          } else if (change.entity_type === 'payment' && change.payload) {
            await db.payments.put({
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
