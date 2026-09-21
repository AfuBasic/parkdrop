import { db } from '@/offline/db/database';
import type { SanitizedDiagnosticReport, HealthState, ErrorCategory } from './recovery-types';

export class RecoveryDiagnostics {
  /**
   * Generates a stable, support-safe diagnostic code: e.g. PD-RCV-8K42
   */
  static generateRecoveryCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 crockford alphabet without lookalikes
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PD-RCV-${code}`;
  }

  /**
   * Builds a strictly redacted diagnostic report containing only operational numbers and system environment.
   * Completely omits customer names, phone numbers, pickup codes, payment amounts, and auth secrets.
   */
  static async buildSanitizedReport(
    healthState: HealthState,
    errorCategory?: ErrorCategory
  ): Promise<SanitizedDiagnosticReport> {
    const recoveryCode = this.generateRecoveryCode();

    let pendingCount = 0;
    let quarantineCount = 0;
    let hasOfflineLease = false;
    let lastSuccessfulSyncAt: string | null = null;
    let storageEstimateMb: number | undefined;

    try {
      if (db.isOpen()) {
        pendingCount = await db.mutations.where('status').anyOf(['PENDING', 'RETRYABLE']).count();
        quarantineCount = await db.quarantineRecords.count();
        
        const lease = await db.authorization.get('current');
        hasOfflineLease = Boolean(lease && new Date(lease.expires_at) > new Date());

        const syncStates = await db.syncState.toArray();
        if (syncStates.length > 0) {
          const sorted = syncStates
            .filter(s => s.last_successful_sync_at)
            .sort((a, b) => (b.last_successful_sync_at || '').localeCompare(a.last_successful_sync_at || ''));
          lastSuccessfulSyncAt = sorted[0]?.last_successful_sync_at || null;
        }
      }
    } catch (e) {
      console.warn('[RecoveryDiagnostics] Could not query database for diagnostics:', e);
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage) {
          storageEstimateMb = Math.round(estimate.usage / (1024 * 1024));
        }
      }
    } catch {
      // Ignore storage estimate failure
    }

    const browserEnv = typeof navigator !== 'undefined' 
      ? `${navigator.userAgent.slice(0, 100)}` 
      : 'Unknown Environment';

    return {
      recoveryCode,
      appVersion: '1.0.0 (Build 23)',
      schemaVersion: 8,
      browserEnvironment: browserEnv,
      healthState,
      errorCategory,
      pendingMutationCount: pendingCount,
      quarantineCount,
      hasOfflineLease,
      lastSuccessfulSyncAt,
      storageEstimateMb,
      reportedAt: new Date().toISOString(),
    };
  }

  /**
   * Formats the diagnostic report into plain text suitable for copying to clipboard for support.
   */
  static formatForClipboard(report: SanitizedDiagnosticReport): string {
    return [
      `=== ParkDrop Support Diagnostic ===`,
      `Recovery Code: ${report.recoveryCode}`,
      `Health State: ${report.healthState}`,
      `Error Category: ${report.errorCategory || 'None'}`,
      `Pending Unsynced Changes: ${report.pendingMutationCount}`,
      `Quarantined Records: ${report.quarantineCount}`,
      `Offline Lease Active: ${report.hasOfflineLease ? 'Yes' : 'No'}`,
      `Last Successful Sync: ${report.lastSuccessfulSyncAt || 'Never'}`,
      `Estimated Storage Used: ${report.storageEstimateMb !== undefined ? `${report.storageEstimateMb} MB` : 'Unknown'}`,
      `Schema Version: ${report.schemaVersion}`,
      `App Build: ${report.appVersion}`,
      `Reported At: ${report.reportedAt}`,
      `====================================`,
    ].join('\n');
  }
}
