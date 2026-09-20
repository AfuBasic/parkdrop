import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/database';
import { PackageRepository } from './PackageRepository';

describe('PackageRepository', () => {
  beforeEach(async () => {
    // Clear DB
    await db.packages.clear();
    await db.mutations.clear();
  });

  it('createLocal saves a package and queues a mutation', async () => {
    const businessId = 1;
    const pickupPointId = 2;
    const customerId = crypto.randomUUID();
    const amountDue = 350000; // 3500 NGN
    const sendSms = true;

    const pkg = await PackageRepository.createLocal(businessId, pickupPointId, customerId, amountDue, sendSms);

    expect(pkg).toBeDefined();
    expect(pkg.business_id).toBe(businessId);
    expect(pkg.pickup_point_id).toBe(pickupPointId);
    expect(pkg.customer_id).toBe(customerId);
    expect(pkg.amount_due_minor).toBe(amountDue);
    expect(pkg.status).toBe('WAITING');
    expect(pkg.public_package_id).toMatch(/^PD-[2-9A-Z]{5}$/);
    expect(pkg.pickup_code).toHaveLength(7);

    // Verify DB insertion
    const savedPackage = await db.packages.get(pkg.id);
    expect(savedPackage).toEqual(pkg);

    // Verify mutation queue
    const mutations = await db.mutations.toArray();
    expect(mutations).toHaveLength(1);
    expect(mutations[0].operation).toBe('CREATE_PACKAGE');
    expect(mutations[0].payload.package_id).toBe(pkg.id);
    expect(mutations[0].payload.arrival_sms_requested).toBe(true);
  });
});
