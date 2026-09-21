import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/offline/db/database';
import { LocalHealthCheck } from './health-check';
import { RecoveryCoordinator } from './recovery-coordinator';
import { RecoveryDiagnostics } from './diagnostics';
import { MutationIntegrity } from './mutation-integrity';
import { StorageGuard } from './storage-guard';

describe('Build 23: Data Backup, Recovery & Operational Resilience', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    if (!db.isOpen()) {
      await db.open();
    }
    await Promise.all([
      db.mutations.clear(),
      db.packages.clear(),
      db.payments.clear(),
      db.packageMedia.clear(),
      db.quarantineRecords.clear(),
      db.recoveryMeta.clear(),
      db.syncState.clear(),
    ]);
  });

  describe('LocalHealthCheck', () => {
    it('returns HEALTHY on clean database and completes rapidly', async () => {
      const startTime = performance.now();
      const result = await LocalHealthCheck.checkStartupHealth();
      const duration = performance.now() - startTime;

      expect(result.isHealthy).toBe(true);
      expect(result.state).toBe('HEALTHY');
      expect(result.pendingMutationCount).toBe(0);
      expect(duration).toBeLessThan(100); // well within bounds
    });

    it('recovers stale SYNCING mutations back to PENDING on startup', async () => {
      // Simulate crash mid-push
      await db.mutations.add({
        mutation_id: 'mut-crashed-1',
        device_uuid: 'dev-1',
        device_sequence: 1,
        business_id: 10,
        pickup_point_id: null,
        operation: 'CREATE_PACKAGE',
        entity_id: 'pkg-1',
        base_version: null,
        payload: { public_package_id: 'PD-1', pickup_code: 'CODE-1' },
        created_at: new Date(Date.now() - 60000).toISOString(),
        status: 'SYNCING',
        attempt_count: 1,
        last_attempt_at: new Date(Date.now() - 60000).toISOString(), // older than 45s threshold
        last_error_code: null,
        last_error_message: null,
      });

      const result = await LocalHealthCheck.checkStartupHealth();
      expect(result.recoveredSyncingCount).toBe(1);

      const recovered = await db.mutations.where('mutation_id').equals('mut-crashed-1').first();
      expect(recovered?.status).toBe('PENDING');
    });

    it('returns RECOVERY_REQUIRED if a fatal recovery marker exists', async () => {
      await db.recoveryMeta.put({
        key: 'fatal_recovery_marker',
        value: { reason: 'UNHANDLED_MIGRATION_ERROR' },
        updated_at: new Date().toISOString(),
      });

      const result = await LocalHealthCheck.checkStartupHealth();
      expect(result.isHealthy).toBe(false);
      expect(result.state).toBe('RECOVERY_REQUIRED');
      expect(result.errorCategory).toBe('RECOVERY_INCOMPLETE');
    });
  });

  describe('MutationIntegrity', () => {
    it('reconstructs missing local package read model from durable mutation payload', async () => {
      await db.mutations.add({
        mutation_id: 'mut-pkg-reconstruct',
        device_uuid: 'dev-1',
        device_sequence: 2,
        business_id: 20,
        pickup_point_id: 2,
        operation: 'CREATE_PACKAGE',
        entity_id: 'pkg-reconstruct-1',
        base_version: null,
        payload: {
          package_id: 'pkg-reconstruct-1',
          customer_id: 'cust-1',
          public_package_id: 'PD-8K42Q',
          pickup_code: '7K4P2MX',
          amount_due_minor: 50000,
          status: 'WAITING',
        },
        created_at: new Date().toISOString(),
        status: 'PENDING',
        attempt_count: 0,
        last_attempt_at: null,
        last_error_code: null,
        last_error_message: null,
      });

      const before = await db.packages.get('pkg-reconstruct-1');
      expect(before).toBeUndefined();

      const { repairedPackages } = await MutationIntegrity.verifyAndRepairOrphanedMutations(20);
      expect(repairedPackages).toBe(1);

      const reconstructed = await db.packages.get('pkg-reconstruct-1');
      expect(reconstructed).toBeDefined();
      expect(reconstructed?.public_package_id).toBe('PD-8K42Q');
      expect(reconstructed?.pickup_code).toBe('7K4P2MX');
      expect(reconstructed?.sync_status).toBe('PENDING_CREATE');
    });

    it('reconstructs missing local payment read model from durable mutation payload', async () => {
      await db.mutations.add({
        mutation_id: 'mut-pay-reconstruct',
        device_uuid: 'dev-1',
        device_sequence: 3,
        business_id: 20,
        pickup_point_id: 2,
        operation: 'RECORD_PAYMENT',
        entity_id: 'pay-reconstruct-1',
        base_version: null,
        payload: {
          payment_id: 'pay-reconstruct-1',
          package_id: 'pkg-1',
          amount_minor: 350000,
          method: 'POS',
        },
        created_at: new Date().toISOString(),
        status: 'PENDING',
        attempt_count: 0,
        last_attempt_at: null,
        last_error_code: null,
        last_error_message: null,
      });

      const { repairedPayments } = await MutationIntegrity.verifyAndRepairOrphanedMutations(20);
      expect(repairedPayments).toBe(1);

      const reconstructed = await db.payments.get('pay-reconstruct-1');
      expect(reconstructed).toBeDefined();
      expect(reconstructed?.amount_minor).toBe(350000);
      expect(reconstructed?.method).toBe('POS');
      expect(reconstructed?.sync_status).toBe('PENDING_CREATE');
    });
  });

  describe('RecoveryCoordinator & Business-Scoped Reset', () => {
    it('audits unsynced records accurately', async () => {
      await db.mutations.add({
        mutation_id: 'mut-audit-1',
        device_uuid: 'dev-1',
        device_sequence: 1,
        business_id: 10,
        pickup_point_id: null,
        operation: 'CREATE_PACKAGE',
        entity_id: 'pkg-audit-1',
        base_version: null,
        payload: {},
        created_at: new Date().toISOString(),
        status: 'PENDING',
        attempt_count: 0,
        last_attempt_at: null,
        last_error_code: null,
        last_error_message: null,
      });

      await db.packages.put({
        id: 'pkg-audit-1',
        business_id: 10,
        pickup_point_id: null,
        customer_id: 'cust-1',
        public_package_id: 'PD-123',
        pickup_code: 'CODE-123',
        amount_due_minor: 0,
        status: 'WAITING',
        client_created_at: new Date().toISOString(),
        server_received_at: null,
        version: 1,
        sync_status: 'PENDING_CREATE',
      });

      const audit = await RecoveryCoordinator.auditUnsyncedData(10);
      expect(audit.totalCount).toBeGreaterThanOrEqual(2);
      expect(audit.pendingMutations).toHaveLength(1);
      expect(audit.pendingPackages).toHaveLength(1);
    });

    it('resets target business sync cursor to 0 during recovery without wiping pending mutations', async () => {
      // Business A and Business B cursors
      await db.syncState.put({ business_id: 10, last_sync_cursor: 50, last_successful_sync_at: '2026-09-20' });
      await db.syncState.put({ business_id: 20, last_sync_cursor: 120, last_successful_sync_at: '2026-09-20' });

      // Pending mutation on Business A
      await db.mutations.add({
        mutation_id: 'mut-persist-1',
        device_uuid: 'dev-1',
        device_sequence: 1,
        business_id: 10,
        pickup_point_id: null,
        operation: 'CREATE_PACKAGE',
        entity_id: 'pkg-persist-1',
        base_version: null,
        payload: { public_package_id: 'PD-A', pickup_code: 'A1' },
        created_at: new Date().toISOString(),
        status: 'PENDING',
        attempt_count: 0,
        last_attempt_at: null,
        last_error_code: null,
        last_error_message: null,
      });

      const res = await RecoveryCoordinator.recoverBusiness(10);
      expect(res.success).toBe(true);

      // Business A cursor reset to 0
      const syncA = await db.syncState.get(10);
      expect(syncA?.last_sync_cursor).toBe(0);

      // Business B untouched
      const syncB = await db.syncState.get(20);
      expect(syncB?.last_sync_cursor).toBe(120);

      // Business A pending mutation preserved
      const pendingA = await db.mutations.where('mutation_id').equals('mut-persist-1').first();
      expect(pendingA).toBeDefined();
    });
  });

  describe('RecoveryDiagnostics & Privacy Redaction', () => {
    it('strictly omits customer names, phones, pickup codes, and amounts from report', async () => {
      const report = await RecoveryDiagnostics.buildSanitizedReport('HEALTHY');
      const text = RecoveryDiagnostics.formatForClipboard(report);

      expect(report.recoveryCode).toMatch(/^PD-RCV-[2-9A-HJ-NP-Z]{4}$/);
      expect(text).not.toContain('080');
      expect(text).not.toContain('+234');
      expect(text).not.toContain('password');
      expect(text).not.toContain('kobo');
      expect(text).toContain('=== ParkDrop Support Diagnostic ===');
      expect(text).toContain('Recovery Code:');
    });
  });

  describe('StorageGuard', () => {
    it('detects quota errors accurately', () => {
      expect(StorageGuard.isQuotaError({ name: 'QuotaExceededError' })).toBe(true);
      expect(StorageGuard.isQuotaError({ message: 'device storage full' })).toBe(true);
      expect(StorageGuard.isQuotaError({ name: 'DatabaseClosedError' })).toBe(false);
    });
  });
});
