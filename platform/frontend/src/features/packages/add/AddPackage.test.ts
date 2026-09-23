import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/offline/db/database';
import { CustomerRepository } from '@/offline/repositories/CustomerRepository';
import { PackageRepository } from '@/offline/repositories/PackageRepository';
import { toNationalDigits, formatNationalDisplay, isCompletePhone } from '@/features/auth/lib/phone';
import { REQUIRE_CUSTOMER_NAME } from './config';

describe('Add Package Flow Logic & Data Layer', () => {
  beforeEach(async () => {
    await db.packages.clear();
    await db.customers.clear();
    await db.mutations.clear();
  });

  it('formats Nigerian phone numbers to national display 0803 123 4567', () => {
    expect(toNationalDigits('08031234567')).toBe('8031234567');
    expect(formatNationalDisplay('08031234567')).toBe('0803 123 4567');
    expect(formatNationalDisplay('+234 803 123 4567')).toBe('0803 123 4567');
    expect(formatNationalDisplay('8031234567')).toBe('0803 123 4567');
    expect(isCompletePhone('08031234567')).toBe(true);
    expect(isCompletePhone('0803123')).toBe(false);
  });

  it('recognises returning customer silently by normalized phone', async () => {
    const businessId = 1;
    await CustomerRepository.createLocal(businessId, 'Chinedu Okafor', '0803 123 4567', null);

    const found = await CustomerRepository.findByNormalizedPhone(businessId, '+2348031234567');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Chinedu Okafor');
  });

  it('saves package locally offline with automatic PD-XXXX public id and pickup code', async () => {
    const businessId = 1;
    const customer = await CustomerRepository.createLocal(businessId, 'Amina Bello', '0901 234 5678', 1);

    const result = await PackageRepository.createLocal(
      businessId,
      1,
      customer.id,
      350000, // ₦3,500
      true,
      null
    );

    expect(result.package).toBeDefined();
    expect(result.package.status).toBe('WAITING');
    expect(result.package.public_package_id).toMatch(/^PD-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);
    expect(result.package.pickup_code.length).toBe(6);
    expect(result.package.amount_due_minor).toBe(350000);

    // Verify written to local IndexedDB
    const saved = await db.packages.get(result.package.id);
    expect(saved).toBeDefined();
    expect(saved?.customer_id).toBe(customer.id);
  });

  it('allows optional customer name by default per config', () => {
    expect(REQUIRE_CUSTOMER_NAME).toBe(false);
  });
});
