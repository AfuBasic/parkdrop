import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/offline/db/database';
import { PackageSearchRepository } from './package-search-repository';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';

describe('PackageSearchRepository', () => {
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
      name: 'Chinedu Okafor',
      phone_display: '0803 123 4567',
      phone_normalized: '+2348031234567',
      version: 1,
      sync_status: 'SYNCED',
    };

    const packageA1: LocalPackage = {
      id: 'pkg-a1',
      business_id: businessA,
      pickup_point_id: 10,
      customer_id: 'cust-a',
      public_package_id: 'PD-8K42Q',
      pickup_code: '7K4P2MX',
      amount_due_minor: 350000,
      status: 'WAITING',
      client_created_at: '2026-09-20T10:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    };

    const packageA2_collected: LocalPackage = {
      id: 'pkg-a2',
      business_id: businessA,
      pickup_point_id: 10,
      customer_id: 'cust-a',
      public_package_id: 'PD-99999',
      pickup_code: '2345678',
      amount_due_minor: 150000,
      status: 'COLLECTED',
      client_created_at: '2026-09-18T10:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    };

    const packageB1: LocalPackage = {
      id: 'pkg-b1',
      business_id: businessB,
      pickup_point_id: 20,
      customer_id: 'cust-b',
      public_package_id: 'PD-8K42Q',
      pickup_code: '7K4P2MX',
      amount_due_minor: 500000,
      status: 'WAITING',
      client_created_at: '2026-09-20T11:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    };

    await db.customers.bulkAdd([customerA, customerB]);
    await db.packages.bulkAdd([packageA1, packageA2_collected, packageB1]);
  });

  it('strictly isolates businesses: Business A does not return Business B packages', async () => {
    const results = await PackageSearchRepository.search({
      businessId: businessA,
      query: '7K4P2MX',
    });

    expect(results).toHaveLength(1);
    expect(results[0].packageId).toBe('pkg-a1');
    expect(results[0].amountDueMinor).toBe(350000);
  });

  it('finds package by exact pickup code', async () => {
    const results = await PackageSearchRepository.search({
      businessId: businessA,
      query: '7k4p2mx', // lowercase case-insensitive
    });

    expect(results).toHaveLength(1);
    expect(results[0].pickupCode).toBe('7K4P2MX');
    expect(results[0].matchedBy).toBe('EXACT_PICKUP_CODE');
  });

  it('finds package by exact public package ID', async () => {
    const results = await PackageSearchRepository.search({
      businessId: businessA,
      query: 'pd-8k42q',
    });

    expect(results).toHaveLength(1);
    expect(results[0].publicPackageId).toBe('PD-8K42Q');
    expect(results[0].matchedBy).toBe('EXACT_PUBLIC_ID');
  });

  it('finds multiple packages by phone number and ranks WAITING first', async () => {
    const results = await PackageSearchRepository.search({
      businessId: businessA,
      query: '0803 123 4567',
    });

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('WAITING');
    expect(results[0].packageId).toBe('pkg-a1');
    expect(results[1].status).toBe('COLLECTED');
    expect(results[1].packageId).toBe('pkg-a2');
  });

  it('finds packages by customer name query', async () => {
    const results = await PackageSearchRepository.search({
      businessId: businessA,
      query: 'Chinedu',
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].customerName).toBe('Chinedu Okafor');
  });

  it('finds unsynced local-only package', async () => {
    const localPkg: LocalPackage = {
      id: 'pkg-local-unsynced',
      business_id: businessA,
      pickup_point_id: 10,
      customer_id: 'cust-a',
      public_package_id: 'PD-LOCAL',
      pickup_code: '8888888',
      amount_due_minor: 200000,
      status: 'WAITING',
      client_created_at: '2026-09-20T12:00:00Z',
      server_received_at: null,
      version: 1,
      sync_status: 'PENDING_CREATE',
    };

    await db.packages.add(localPkg);

    const results = await PackageSearchRepository.search({
      businessId: businessA,
      query: '8888888',
    });

    expect(results).toHaveLength(1);
    expect(results[0].packageId).toBe('pkg-local-unsynced');
    expect(results[0].syncStatus).toBe('PENDING_CREATE');
  });
});
