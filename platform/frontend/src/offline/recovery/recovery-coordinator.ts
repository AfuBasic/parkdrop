import { db } from '@/offline/db/database';
import { MutationIntegrity } from './mutation-integrity';
import type { LocalMutation, LocalPackage, LocalPayment, LocalPackageMedia, LocalConflict } from '@/offline/db/schema';

export interface UnsyncedDataAudit {
  pendingMutations: LocalMutation[];
  pendingPackages: LocalPackage[];
  pendingPayments: LocalPayment[];
  pendingMedia: LocalPackageMedia[];
  unresolvedConflicts: LocalConflict[];
  totalCount: number;
}

export class RecoveryCoordinator {
  private static lockHeld = false;
  private static lockHeartbeatTimer: any = null;

  /**
   * Acquire an exclusive recovery lock across browser tabs using Web Locks API or fallback lease.
   */
  static async acquireRecoveryLock(): Promise<boolean> {
    if (this.lockHeld) return true;

    if (typeof navigator !== 'undefined' && (navigator as any).locks) {
      try {
        let lockAcquired = false;
        await new Promise<void>((resolve) => {
          (navigator as any).locks.request('parkdrop_recovery_lock', { ifAvailable: true }, async (lock: any) => {
            if (lock) {
              lockAcquired = true;
              this.lockHeld = true;
              this.startHeartbeat();
              resolve();
              // Keep lock open until released
              await new Promise<void>((releaseResolve) => {
                const checkInterval = setInterval(() => {
                  if (!this.lockHeld) {
                    clearInterval(checkInterval);
                    releaseResolve();
                  }
                }, 200);
              });
            } else {
              resolve();
            }
          });
        });

        if (lockAcquired) return true;
      } catch (err) {
        console.warn('[RecoveryCoordinator] Web Locks request error, falling back to Dexie lease:', err);
      }
    }

    // Fallback: recoveryMeta lock with 30s lease timeout
    try {
      const now = Date.now();
      const existing = await db.recoveryMeta.get('active_recovery_lock');
      if (existing && typeof existing.value === 'number' && now - existing.value < 30000) {
        return false; // Lock held by another tab
      }

      await db.recoveryMeta.put({
        key: 'active_recovery_lock',
        value: now,
        updated_at: new Date().toISOString(),
      });
      this.lockHeld = true;
      this.startHeartbeat();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Release the recovery lock.
   */
  static async releaseRecoveryLock(): Promise<void> {
    this.lockHeld = false;
    if (this.lockHeartbeatTimer) {
      clearInterval(this.lockHeartbeatTimer);
      this.lockHeartbeatTimer = null;
    }
    try {
      await db.recoveryMeta.delete('active_recovery_lock');
    } catch {
      // Ignore
    }
  }

  private static startHeartbeat() {
    if (this.lockHeartbeatTimer) clearInterval(this.lockHeartbeatTimer);
    this.lockHeartbeatTimer = setInterval(async () => {
      if (!this.lockHeld) return;
      try {
        await db.recoveryMeta.put({
          key: 'active_recovery_lock',
          value: Date.now(),
          updated_at: new Date().toISOString(),
        });
      } catch {
        // Ignore
      }
    }, 10000);
  }

  /**
   * Audits all irreplaceable unsynced records across the database.
   */
  static async auditUnsyncedData(businessId?: number): Promise<UnsyncedDataAudit> {
    let mutationsQuery = db.mutations.where('status').anyOf(['PENDING', 'RETRYABLE']);
    let packagesQuery = db.packages.where('sync_status').equals('PENDING_CREATE');
    let paymentsQuery = db.payments.where('sync_status').equals('PENDING_CREATE');
    let mediaQuery = db.packageMedia.where('status').anyOf(['PENDING_UPLOAD', 'FAILED_RETRYABLE']);
    let conflictsQuery = db.conflicts.where('status').equals('UNRESOLVED');

    if (businessId) {
      mutationsQuery = db.mutations.where('[business_id+status]').anyOf([[businessId, 'PENDING'], [businessId, 'RETRYABLE']]);
      packagesQuery = db.packages.where('[business_id+status]').anyOf([[businessId, 'WAITING'], [businessId, 'COLLECTED']]);
      // Filter memory side for multi-field business_id matching if needed
    }

    const [pendingMutations, allPackages, allPayments, allMedia, allConflicts] = await Promise.all([
      mutationsQuery.toArray(),
      packagesQuery.toArray(),
      paymentsQuery.toArray(),
      mediaQuery.toArray(),
      conflictsQuery.toArray(),
    ]);

    const pendingPackages = allPackages.filter(p => (!businessId || p.business_id === businessId) && p.sync_status === 'PENDING_CREATE');
    const pendingPayments = allPayments.filter(p => (!businessId || p.business_id === businessId) && p.sync_status === 'PENDING_CREATE');
    const pendingMedia = allMedia.filter(m => (!businessId || m.business_id === businessId) && (m.status === 'PENDING_UPLOAD' || m.status === 'FAILED_RETRYABLE'));
    const unresolvedConflicts = allConflicts.filter(c => (!businessId || c.business_id === businessId) && c.status === 'UNRESOLVED');

    const totalCount = pendingMutations.length + pendingPackages.length + pendingPayments.length + pendingMedia.length + unresolvedConflicts.length;

    return {
      pendingMutations,
      pendingPackages,
      pendingPayments,
      pendingMedia,
      unresolvedConflicts,
      totalCount,
    };
  }

  /**
   * Execute safe business recovery:
   * 1. Acquires lock.
   * 2. Snapshots & repairs orphaned local entities.
   * 3. Resets cursor for the target business.
   * 4. Pulls canonical server state without erasing pending mutations.
   * 5. Releases lock.
   */
  static async recoverBusiness(businessId: number): Promise<{ success: boolean; repaired: number; error?: string }> {
    const lockAcquired = await this.acquireRecoveryLock();
    if (!lockAcquired) {
      return { success: false, repaired: 0, error: 'Another tab is currently performing recovery.' };
    }

    try {
      // 1. Audit and repair any orphaned mutations before touching cursor
      const { repairedPackages, repairedPayments } = await MutationIntegrity.verifyAndRepairOrphanedMutations(businessId);

      // 2. Reset cursor for business so pull starts from 0 (re-bootstrap)
      await db.syncState.put({
        business_id: businessId,
        last_sync_cursor: 0,
        last_successful_sync_at: null,
      });

      // 3. Clear transient error markers
      await db.recoveryMeta.delete('fatal_recovery_marker');

      return {
        success: true,
        repaired: repairedPackages + repairedPayments,
      };
    } catch (err: any) {
      console.error('[RecoveryCoordinator] Recovery failed:', err);
      return { success: false, repaired: 0, error: err?.message || 'Recovery failed.' };
    } finally {
      await this.releaseRecoveryLock();
    }
  }

  /**
   * Destructive local reset — strictly the last resort.
   * Clears local tables for the browser without touching server data.
   */
  static async performSafeReset(): Promise<void> {
    const lockAcquired = await this.acquireRecoveryLock();
    if (!lockAcquired) {
      throw new Error('Another window is currently performing maintenance.');
    }

    try {
      await Promise.all([
        db.packages.clear(),
        db.customers.clear(),
        db.payments.clear(),
        db.packageMedia.clear(),
        db.smsWallets.clear(),
        db.smsCreditTransactions.clear(),
        db.mutations.clear(),
        db.syncState.clear(),
        db.conflicts.clear(),
        db.entityAliases.clear(),
        db.authorization.clear(),
        db.quarantineRecords.clear(),
        db.recoveryMeta.clear(),
      ]);
    } finally {
      await this.releaseRecoveryLock();
    }
  }
}
