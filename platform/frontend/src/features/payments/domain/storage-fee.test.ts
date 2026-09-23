import { describe, it, expect } from 'vitest';
import { extraStorageDays, accruedAmountDueMinor, DEFAULT_DAILY_STORAGE_FEE_MINOR } from './storage-fee';
import type { LocalPackage } from '@/offline/db/schema';

function makePackage(overrides: Partial<LocalPackage> = {}): LocalPackage {
  return {
    id: 'pkg-1',
    business_id: 1,
    pickup_point_id: 1,
    customer_id: 'cust-1',
    public_package_id: 'PD-1',
    pickup_code: 'ABC1234',
    amount_due_minor: 100_000, // NGN 1,000
    status: 'WAITING',
    client_created_at: '2026-09-20T13:00:00.000Z', // Day 0, 1pm
    server_received_at: null,
    version: 1,
    sync_status: 'SYNCED',
    ...overrides,
  } as LocalPackage;
}

describe('storage-fee', () => {
  it('counts a package picked up 2pm the next day as still day 1 — no extra charge', () => {
    // Day 0 1pm drop-off, Day 1 2pm pickup: one night passed.
    const pkg = makePackage();
    const now = new Date('2026-09-21T14:00:00.000Z');
    expect(extraStorageDays(pkg, now)).toBe(0);
    expect(accruedAmountDueMinor(pkg, 50_000, now)).toBe(100_000);
  });

  it('counts a package picked up 8am the day after that as one extra day, even under 48h', () => {
    // Day 0 1pm drop-off, Day 2 8am pickup: two nights passed, ~43 actual hours.
    const pkg = makePackage();
    const now = new Date('2026-09-22T08:00:00.000Z');
    expect(extraStorageDays(pkg, now)).toBe(1);
    expect(accruedAmountDueMinor(pkg, 50_000, now)).toBe(150_000);
  });

  it('never charges for the first day', () => {
    const pkg = makePackage();
    const now = new Date('2026-09-20T15:00:00.000Z'); // same day
    expect(extraStorageDays(pkg, now)).toBe(0);
  });

  it('freezes accrual at the moment of collection, not the live clock', () => {
    const pkg = makePackage({
      status: 'COLLECTED',
      collected_at: '2026-09-21T14:00:00.000Z', // collected on day 1 — 0 extra days
    });
    // "now" is a week later; a stale receipt must not keep growing.
    const now = new Date('2026-09-28T09:00:00.000Z');
    expect(extraStorageDays(pkg, now)).toBe(0);
    expect(accruedAmountDueMinor(pkg, 50_000, now)).toBe(100_000);
  });

  it('freezes accrual at return/cancellation the same way', () => {
    const pkg = makePackage({
      status: 'RETURNED',
      returned_at: '2026-09-23T08:00:00.000Z', // 3 nights passed -> 2 extra days
    });
    const now = new Date('2026-09-30T09:00:00.000Z');
    expect(extraStorageDays(pkg, now)).toBe(2);
    expect(accruedAmountDueMinor(pkg, 50_000, now)).toBe(200_000);
  });

  it('never goes negative even with a bad rate or amount', () => {
    const pkg = makePackage({ amount_due_minor: -5 });
    const now = new Date('2026-09-25T09:00:00.000Z');
    expect(accruedAmountDueMinor(pkg, -100, now)).toBe(0);
  });

  it('has a sane default matching the backend column default', () => {
    expect(DEFAULT_DAILY_STORAGE_FEE_MINOR).toBe(50_000);
  });
});
