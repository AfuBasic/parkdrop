import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/offline/db/database';
import { PackageLifecycleRepository } from './PackageLifecycleRepository';
import type { LocalPackage } from '@/offline/db/schema';

describe('PackageLifecycleRepository', () => {
  const businessId = 1;
  const packageId = 'pkg-lifecycle-test-1';

  beforeEach(async () => {
    await db.packages.clear();
    await db.mutations.clear();

    const testPackage: LocalPackage = {
      id: packageId,
      business_id: businessId,
      pickup_point_id: null,
      customer_id: 'cust-1',
      public_package_id: 'PD-TEST1',
      pickup_code: '7K4P2MX',
      amount_due_minor: 350000,
      status: 'WAITING',
      client_created_at: new Date().toISOString(),
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    };

    await db.packages.put(testPackage);
  });

  it('marks a package as RETURNED and queues a RETURN_PACKAGE mutation', async () => {
    const updated = await PackageLifecycleRepository.returnPackageLocally({
      businessId,
      pickupPointId: null,
      packageId,
      reason: 'CUSTOMER_DID_NOT_COLLECT',
      reasonNote: null,
      actorName: 'Ada',
    });

    expect(updated.status).toBe('RETURNED');
    expect(updated.terminal_reason).toBe('CUSTOMER_DID_NOT_COLLECT');
    expect(updated.returned_at).toBeDefined();

    // Check database
    const inDb = await db.packages.get(packageId);
    expect(inDb?.status).toBe('RETURNED');

    // Check queued mutation
    const mutations = await db.mutations.toArray();
    expect(mutations).toHaveLength(1);
    expect(mutations[0].operation).toBe('RETURN_PACKAGE');
    expect(mutations[0].payload.reason).toBe('CUSTOMER_DID_NOT_COLLECT');
  });

  it('marks a package as CANCELLED and queues a CANCEL_PACKAGE mutation', async () => {
    const updated = await PackageLifecycleRepository.cancelPackageLocally({
      businessId,
      pickupPointId: null,
      packageId,
      reason: 'DUPLICATE_RECORD',
      reasonNote: 'Accidental duplicate',
      actorName: 'Ada',
    });

    expect(updated.status).toBe('CANCELLED');
    expect(updated.terminal_reason).toBe('DUPLICATE_RECORD');
    expect(updated.terminal_reason_note).toBe('Accidental duplicate');
    expect(updated.cancelled_at).toBeDefined();

    const inDb = await db.packages.get(packageId);
    expect(inDb?.status).toBe('CANCELLED');

    const mutations = await db.mutations.toArray();
    expect(mutations).toHaveLength(1);
    expect(mutations[0].operation).toBe('CANCEL_PACKAGE');
  });

  it('requires reason note when reason is OTHER', async () => {
    await expect(
      PackageLifecycleRepository.returnPackageLocally({
        businessId,
        pickupPointId: null,
        packageId,
        reason: 'OTHER',
        reasonNote: '',
      })
    ).rejects.toThrow('REASON_NOTE_REQUIRED_FOR_OTHER');
  });

  it('rejects return or cancel if package status is not WAITING', async () => {
    await db.packages.update(packageId, { status: 'COLLECTED' });

    await expect(
      PackageLifecycleRepository.returnPackageLocally({
        businessId,
        pickupPointId: null,
        packageId,
        reason: 'RETURNED_TO_SENDER',
      })
    ).rejects.toThrow('PACKAGE_NOT_WAITING');

    await expect(
      PackageLifecycleRepository.cancelPackageLocally({
        businessId,
        pickupPointId: null,
        packageId,
        reason: 'CREATED_BY_MISTAKE',
      })
    ).rejects.toThrow('PACKAGE_NOT_WAITING');
  });
});
