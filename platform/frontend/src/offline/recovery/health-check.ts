import { db } from '@/offline/db/database';
import type { HealthCheckResult } from './recovery-types';

export class LocalHealthCheck {
  /**
   * Fast, indexed startup health check (< 15ms target).
   * 1. Opens Dexie DB safely.
   * 2. Recovers stale SYNCING mutations from crashed prior sessions back to PENDING.
   * 3. Audits pending mutations and quarantine count without full table scans.
   */
  static async checkStartupHealth(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();

    try {
      // 1. Ensure DB opens successfully
      if (!db.isOpen()) {
        await db.open();
      }

      // 2. Recover stale SYNCING mutations
      // If the browser crashed mid-push, mutations might be stuck in SYNCING state.
      // Reset any SYNCING mutation older than 45 seconds (or with no attempt timestamp) back to PENDING.
      let recoveredSyncingCount = 0;
      const staleThreshold = new Date(Date.now() - 45000).toISOString();

      const syncingMutations = await db.mutations
        .where('status')
        .equals('SYNCING')
        .toArray();

      for (const m of syncingMutations) {
        if (!m.last_attempt_at || m.last_attempt_at < staleThreshold) {
          await db.mutations.where('mutation_id').equals(m.mutation_id).modify({
            status: 'PENDING',
            last_error_message: 'Sync interrupted by app reload or connection loss; queued for retry.',
          });
          recoveredSyncingCount++;
        }
      }

      // 3. Count pending mutations and quarantine records (indexed queries)
      const pendingCount = await db.mutations
        .where('status')
        .anyOf(['PENDING', 'RETRYABLE'])
        .count();

      const quarantineCount = await db.quarantineRecords.count();

      // Check if critical fatal recovery marker is present
      const recoveryMarker = await db.recoveryMeta.get('fatal_recovery_marker');
      if (recoveryMarker) {
        return {
          state: 'RECOVERY_REQUIRED',
          phase: 'LOCAL_HEALTH',
          isHealthy: false,
          message: 'Previous recovery attempt required intervention.',
          errorCategory: 'RECOVERY_INCOMPLETE',
          pendingMutationCount: pendingCount,
          quarantineCount,
          recoveredSyncingCount,
          timestamp,
        };
      }

      const state = quarantineCount > 0 ? 'DEGRADED' : 'HEALTHY';

      return {
        state,
        phase: 'READY',
        isHealthy: true,
        pendingMutationCount: pendingCount,
        quarantineCount,
        recoveredSyncingCount,
        timestamp,
      };
    } catch (err: any) {
      console.error('[LocalHealthCheck] Startup check failed:', err);

      return {
        state: 'RECOVERY_REQUIRED',
        phase: 'DB_OPEN',
        isHealthy: false,
        message: err?.message || 'Database could not be opened.',
        errorCategory: 'DB_OPEN_FAILED',
        pendingMutationCount: 0,
        quarantineCount: 0,
        recoveredSyncingCount: 0,
        timestamp,
      };
    }
  }
}
