import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/offline/db/database';
import { PackageRepository } from './PackageRepository';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';

describe('PackageRepository.listByStatus & countByStatus', () => {
  const businessA = 1;
  const businessB = 2;

  beforeEach(async () => {
    await db.packages.clear();
    await db.customers.clear();

    const customerA: LocalCustomer = {
      id: 'cust-a',
      business_id: businessA,
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED',
    };

    const customerB: LocalCustomer = {
      id: 'cust-b',
      business_id: businessB,
      name: 'Ngozi Eze',
      phone_display: '0802 555 1234',
      phone_normalized: '+2348025551234',
      version: 1,
      sync_status: 'SYNCED',
    };

    const packagesA: LocalPackage[] = [
      {
        id: 'pkg-w1',
        business_id: businessA,
        pickup_point_id: 1,
        customer_id: 'cust-a',
        public_package_id: 'PD-W1000',
        pickup_code: '7K4P2MX',
        amount_due_minor: 350000,
        status: 'WAITING',
        client_created_at: '2026-09-20T10:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
      {
        id: 'pkg-w2',
        business_id: businessA,
        pickup_point_id: 1,
        customer_id: 'cust-a',
        public_package_id: 'PD-W2000',
        pickup_code: '3B8M4XY',
        amount_due_minor: 150000,
        status: 'WAITING',
        client_created_at: '2026-09-20T11:00:00Z', // newer
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
      {
        id: 'pkg-col1',
        business_id: businessA,
        pickup_point_id: 1,
        customer_id: 'cust-a',
        public_package_id: 'PD-C1000',
        pickup_code: '9H72KQX',
        amount_due_minor: 250000,
        status: 'COLLECTED',
        client_created_at: '2026-09-18T10:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
      {
        id: 'pkg-ret1',
        business_id: businessA,
        pickup_point_id: 1,
        customer_id: 'cust-a',
        public_package_id: 'PD-R1000',
        pickup_code: '2H4P9MN',
        amount_due_minor: 500000,
        status: 'RETURNED',
        client_created_at: '2026-09-17T10:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
    ];

    const packagesB: LocalPackage[] = [
      {
        id: 'pkg-b-w1',
        business_id: businessB,
        pickup_point_id: 2,
        customer_id: 'cust-b',
        public_package_id: 'PD-BW001',
        pickup_code: '8T9P2QZ',
        amount_due_minor: 900000,
        status: 'WAITING',
        client_created_at: '2026-09-20T12:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
    ];

    await db.customers.bulkAdd([customerA, customerB]);
    await db.packages.bulkAdd([...packagesA, ...packagesB]);
  });

  it('accurately counts packages by status strictly scoped to Business A', async () => {
    const counts = await PackageRepository.countByStatus(businessA, null);
    expect(counts).toEqual({
      WAITING: 2,
      COLLECTED: 1,
      RETURNED: 1,
      CANCELLED: 0,
    });
  });

  it('lists only WAITING packages sorted by client_created_at descending', async () => {
    const list = await PackageRepository.listByStatus(businessA, null, 'WAITING');
    expect(list).toHaveLength(2);
    // Newer package (11:00:00Z) comes first
    expect(list[0].id).toBe('pkg-w2');
    expect(list[1].id).toBe('pkg-w1');
    expect(list[0].customer_name).toBe('Chinedu Okafor');
  });

  it('lists only COLLECTED packages for Business A', async () => {
    const list = await PackageRepository.listByStatus(businessA, null, 'COLLECTED');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('pkg-col1');
    expect(list[0].status).toBe('COLLECTED');
  });

  it('never returns Business B packages for Business A query', async () => {
    const list = await PackageRepository.listByStatus(businessA, null, 'WAITING');
    const ids = list.map(p => p.id);
    expect(ids).not.toContain('pkg-b-w1');
  });

  it('includes local pending package in list and counts', async () => {
    const localPkg: LocalPackage = {
      id: 'pkg-local-pending',
      business_id: businessA,
      pickup_point_id: 1,
      customer_id: 'cust-a',
      public_package_id: 'PD-LOCAL1',
      pickup_code: '5V8T3QA',
      amount_due_minor: 180000,
      status: 'WAITING',
      client_created_at: '2026-09-20T13:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'PENDING_CREATE',
    };

    await db.packages.add(localPkg);

    const counts = await PackageRepository.countByStatus(businessA, null);
    expect(counts.WAITING).toBe(3);

    const list = await PackageRepository.listByStatus(businessA, null, 'WAITING');
    expect(list).toHaveLength(3);
    // Newest is localPkg
    expect(list[0].id).toBe('pkg-local-pending');
    expect(list[0].sync_status).toBe('PENDING_CREATE');
  });
});
