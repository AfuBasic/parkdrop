import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/offline/db/database';
import { CustomerDirectoryRepository } from './CustomerDirectoryRepository';
import type { LocalCustomer, LocalPackage, LocalEntityAlias } from '@/offline/db/schema';

describe('CustomerDirectoryRepository', () => {
  const businessA = 1;
  const businessB = 2;

  beforeEach(async () => {
    await db.customers.clear();
    await db.packages.clear();
    await db.entityAliases.clear();

    const customers: LocalCustomer[] = [
      {
        id: 'cust-1',
        business_id: businessA,
        name: 'Chinedu Okafor',
        phone_display: '0803 123 4567',
        phone_normalized: '+2348031234567',
        version: 1,
        sync_status: 'SYNCED',
      },
      {
        id: 'cust-2',
        business_id: businessA,
        name: 'Ngozi Eze',
        phone_display: '0802 555 1234',
        phone_normalized: '+2348025551234',
        version: 1,
        sync_status: 'SYNCED',
      },
      {
        id: 'cust-3',
        business_id: businessA,
        name: 'Babajide Sanwo',
        phone_display: '0818 999 8888',
        phone_normalized: '+2348189998888',
        version: 1,
        sync_status: 'PENDING_CREATE',
      },
      // Tenant B customer with same name/phone
      {
        id: 'cust-b',
        business_id: businessB,
        name: 'Chinedu Okafor',
        phone_display: '0803 123 4567',
        phone_normalized: '+2348031234567',
        version: 1,
        sync_status: 'SYNCED',
      },
    ];

    const packages: LocalPackage[] = [
      // cust-1: 2 packages waiting, 1 collected
      {
        id: 'pkg-1',
        business_id: businessA,
        pickup_point_id: 1,
        customer_id: 'cust-1',
        public_package_id: 'PD-8K42Q',
        pickup_code: '7K4P2MX',
        amount_due_minor: 350000,
        status: 'WAITING',
        client_created_at: '2026-09-20T10:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
      {
        id: 'pkg-2',
        business_id: businessA,
        pickup_point_id: 1,
        customer_id: 'cust-1',
        public_package_id: 'PD-P31KQ',
        pickup_code: '9H72KQX',
        amount_due_minor: 200000,
        status: 'WAITING',
        client_created_at: '2026-09-20T11:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
      {
        id: 'pkg-3',
        business_id: businessA,
        pickup_point_id: 1,
        customer_id: 'cust-1',
        public_package_id: 'PD-OLD01',
        pickup_code: '2A3B4CD',
        amount_due_minor: 150000,
        status: 'COLLECTED',
        client_created_at: '2026-09-18T10:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
      // cust-2: 0 waiting, 1 collected
      {
        id: 'pkg-4',
        business_id: businessA,
        pickup_point_id: 1,
        customer_id: 'cust-2',
        public_package_id: 'PD-71KQP',
        pickup_code: '8Y7X6WV',
        amount_due_minor: 100000,
        status: 'COLLECTED',
        client_created_at: '2026-09-19T09:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
      // Tenant B package
      {
        id: 'pkg-b',
        business_id: businessB,
        pickup_point_id: 2,
        customer_id: 'cust-b',
        public_package_id: 'PD-TENB1',
        pickup_code: '1111111',
        amount_due_minor: 500000,
        status: 'WAITING',
        client_created_at: '2026-09-20T12:00:00Z',
        server_received_at: null,
        version: 1,
        sync_status: 'SYNCED',
      },
    ];

    await db.customers.bulkAdd(customers);
    await db.packages.bulkAdd(packages);
  });

  it('strictly scopes customers and packages to the requested business', async () => {
    const { items, totalCount } = await CustomerDirectoryRepository.getDirectoryItems(businessA);

    expect(totalCount).toBe(3);
    const ids = items.map(i => i.id);
    expect(ids).toContain('cust-1');
    expect(ids).toContain('cust-2');
    expect(ids).toContain('cust-3');
    expect(ids).not.toContain('cust-b');

    // Packages count check
    const cust1 = items.find(i => i.id === 'cust-1')!;
    expect(cust1.waitingPackageCount).toBe(2);
    expect(cust1.totalPackageCount).toBe(3);

    const cust2 = items.find(i => i.id === 'cust-2')!;
    expect(cust2.waitingPackageCount).toBe(0);
    expect(cust2.totalPackageCount).toBe(1);

    const cust3 = items.find(i => i.id === 'cust-3')!;
    expect(cust3.waitingPackageCount).toBe(0);
    expect(cust3.totalPackageCount).toBe(0);
  });

  it('sorts customers with waiting packages first, then most recently active', async () => {
    const { items } = await CustomerDirectoryRepository.getDirectoryItems(businessA);

    // cust-1 has 2 waiting packages -> must be first
    expect(items[0].id).toBe('cust-1');
    // cust-2 has 0 waiting packages but was active on 2026-09-19 -> comes before cust-3 (no packages)
    expect(items[1].id).toBe('cust-2');
    expect(items[2].id).toBe('cust-3');
  });

  it('searches customers by name case-insensitively with partial matching', async () => {
    const searchChinedu = await CustomerDirectoryRepository.getDirectoryItems(businessA, 'chinedu');
    expect(searchChinedu.items.length).toBe(1);
    expect(searchChinedu.items[0].id).toBe('cust-1');

    const searchOkafor = await CustomerDirectoryRepository.getDirectoryItems(businessA, 'OKAFOR');
    expect(searchOkafor.items.length).toBe(1);
    expect(searchOkafor.items[0].id).toBe('cust-1');

    const searchTokens = await CustomerDirectoryRepository.getDirectoryItems(businessA, 'sanwo babajide');
    expect(searchTokens.items.length).toBe(1);
    expect(searchTokens.items[0].id).toBe('cust-3');
  });

  it('searches customers by phone across Nigerian display variants', async () => {
    // 0803 123 4567
    const search1 = await CustomerDirectoryRepository.getDirectoryItems(businessA, '08031234567');
    expect(search1.items.length).toBe(1);
    expect(search1.items[0].id).toBe('cust-1');

    const search2 = await CustomerDirectoryRepository.getDirectoryItems(businessA, '+2348031234567');
    expect(search2.items.length).toBe(1);
    expect(search2.items[0].id).toBe('cust-1');

    const search3 = await CustomerDirectoryRepository.getDirectoryItems(businessA, '2348031234567');
    expect(search3.items.length).toBe(1);
    expect(search3.items[0].id).toBe('cust-1');

    const searchPartial = await CustomerDirectoryRepository.getDirectoryItems(businessA, '555 1234');
    expect(searchPartial.items.length).toBe(1);
    expect(searchPartial.items[0].id).toBe('cust-2');
  });

  it('resolves customer aliases seamlessly in directory and detail', async () => {
    // Scenario: local customer 'cust-local-alias' was created offline and later mapped to 'cust-1'
    const aliasRecord: LocalEntityAlias = {
      local_id: 'cust-local-alias',
      canonical_id: 'cust-1',
      entity_type: 'customer',
      resolved_at: new Date().toISOString(),
    };
    await db.entityAliases.put(aliasRecord);

    // Also add a package referencing 'cust-local-alias'
    const aliasedPackage: LocalPackage = {
      id: 'pkg-aliased',
      business_id: businessA,
      pickup_point_id: 1,
      customer_id: 'cust-local-alias',
      public_package_id: 'PD-ALIAS1',
      pickup_code: '7777777',
      amount_due_minor: 400000,
      status: 'WAITING',
      client_created_at: '2026-09-20T15:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    };
    await db.packages.add(aliasedPackage);

    // In directory: 'cust-1' should now have 3 waiting packages
    const { items } = await CustomerDirectoryRepository.getDirectoryItems(businessA);
    const cust1 = items.find(i => i.id === 'cust-1')!;
    expect(cust1.waitingPackageCount).toBe(3);
    expect(cust1.totalPackageCount).toBe(4);

    // Detail using the old aliased local ID should resolve to cust-1
    const detailFromAlias = await CustomerDirectoryRepository.getCustomerDetail(businessA, 'cust-local-alias');
    expect(detailFromAlias).not.toBeNull();
    expect(detailFromAlias!.canonicalId).toBe('cust-1');
    expect(detailFromAlias!.waitingCount).toBe(3);
    expect(detailFromAlias!.waitingPackages.some(p => p.id === 'pkg-aliased')).toBe(true);
  });

  it('partitions customer packages into waiting and recent history', async () => {
    const detail = await CustomerDirectoryRepository.getCustomerDetail(businessA, 'cust-1');

    expect(detail).not.toBeNull();
    expect(detail!.customer.name).toBe('Chinedu Okafor');
    expect(detail!.waitingPackages.length).toBe(2);
    expect(detail!.recentPackages.length).toBe(1);
    expect(detail!.recentPackages[0].publicPackageId).toBe('PD-OLD01');
    expect(detail!.recentPackages[0].status).toBe('COLLECTED');
  });

  it('returns null if customer does not exist or belongs to another business', async () => {
    const notFound = await CustomerDirectoryRepository.getCustomerDetail(businessA, 'non-existent-id');
    expect(notFound).toBeNull();

    // Cross-tenant attempt: accessing cust-b from businessA
    const crossTenant = await CustomerDirectoryRepository.getCustomerDetail(businessA, 'cust-b');
    expect(crossTenant).toBeNull();
  });
});
