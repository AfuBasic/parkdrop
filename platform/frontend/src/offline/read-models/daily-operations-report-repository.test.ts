import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/offline/db/database';
import { DailyOperationsReportRepository } from './daily-operations-report-repository';

describe('DailyOperationsReportRepository', () => {
  const businessId = 1001;
  const otherBusinessId = 1002;
  const pickupPoint1 = 1;
  const pickupPoint2 = 2;

  beforeEach(async () => {
    await db.packages.clear();
    await db.payments.clear();
    await db.customers.clear();
  });

  it('correctly calculates Africa/Lagos UTC bounds for midnight', () => {
    const { startUtc, endUtc } = DailyOperationsReportRepository.getLagosDayBounds('2026-09-21');
    expect(startUtc).toBe('2026-09-20T23:00:00.000Z');
    expect(endUtc).toBe('2026-09-21T23:00:00.000Z');
  });

  it('aggregates packages received, collected, returned, and cancelled accurately', async () => {
    const today = '2026-09-21';
    // Midday WAT = 11:00 UTC
    const midday = '2026-09-21T11:00:00.000Z';

    // 1. Package received today, still WAITING
    await db.packages.put({
      id: 'pkg-1',
      business_id: businessId,
      pickup_point_id: pickupPoint1,
      customer_id: 'cust-1',
      public_package_id: 'PD-1',
      pickup_code: 'CODE1',
      amount_due_minor: 100000,
      status: 'WAITING',
      client_created_at: midday,
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    });

    // 2. Package received today AND collected today (counts in BOTH)
    await db.packages.put({
      id: 'pkg-2',
      business_id: businessId,
      pickup_point_id: pickupPoint1,
      customer_id: 'cust-1',
      public_package_id: 'PD-2',
      pickup_code: 'CODE2',
      amount_due_minor: 0,
      status: 'COLLECTED',
      client_created_at: midday,
      server_received_at: null,
      version: 2,
      sync_status: 'SYNCED',
      ...( { updated_at: '2026-09-21T14:00:00.000Z' } as any ),
    });

    // 3. Package returned today (received yesterday)
    await db.packages.put({
      id: 'pkg-3',
      business_id: businessId,
      pickup_point_id: pickupPoint1,
      customer_id: 'cust-1',
      public_package_id: 'PD-3',
      pickup_code: 'CODE3',
      amount_due_minor: 100000,
      status: 'RETURNED',
      client_created_at: '2026-09-20T10:00:00.000Z',
      server_received_at: null,
      returned_at: midday,
      terminal_reason: 'CUSTOMER_DID_NOT_COLLECT',
      version: 2,
      sync_status: 'SYNCED',
    });

    // 4. Package cancelled today (scoped to Counter 2)
    await db.packages.put({
      id: 'pkg-4',
      business_id: businessId,
      pickup_point_id: pickupPoint2,
      customer_id: 'cust-1',
      public_package_id: 'PD-4',
      pickup_code: 'CODE4',
      amount_due_minor: 100000,
      status: 'CANCELLED',
      client_created_at: '2026-09-19T10:00:00.000Z',
      server_received_at: null,
      cancelled_at: midday,
      terminal_reason: 'DAMAGED_BEFORE_DISPATCH',
      version: 2,
      sync_status: 'SYNCED',
    });

    // Package from another business (must be excluded)
    await db.packages.put({
      id: 'pkg-other',
      business_id: otherBusinessId,
      pickup_point_id: 99,
      customer_id: 'cust-other',
      public_package_id: 'PD-OTHER',
      pickup_code: 'OTHER',
      amount_due_minor: 50000,
      status: 'WAITING',
      client_created_at: midday,
      server_received_at: null,
      version: 1,
      sync_status: 'SYNCED',
    });

    // Business-wide summary
    const summaryAll = await DailyOperationsReportRepository.getLocalSummary(businessId, today, 'all', true);
    expect(summaryAll.packages.receivedCount).toBe(2);
    expect(summaryAll.packages.collectedCount).toBe(1);
    expect(summaryAll.packages.returnedCount).toBe(1);
    expect(summaryAll.packages.cancelledCount).toBe(1);

    // Scoped to Counter 1
    const summaryPoint1 = await DailyOperationsReportRepository.getLocalSummary(businessId, today, pickupPoint1, true);
    expect(summaryPoint1.packages.receivedCount).toBe(2);
    expect(summaryPoint1.packages.collectedCount).toBe(1);
    expect(summaryPoint1.packages.returnedCount).toBe(1);
    expect(summaryPoint1.packages.cancelledCount).toBe(0); // Cancelled was at Counter 2
  });

  it('calculates positive payments, method breakdown, and reversals accurately', async () => {
    const today = '2026-09-21';
    const midday = '2026-09-21T11:00:00.000Z';

    // Positive payments
    await db.payments.put({
      id: 'pay-1',
      business_id: businessId,
      package_id: 'pkg-1',
      amount_minor: 200000, // ₦2,000 Cash
      method: 'CASH',
      recorded_by_user_id: 1,
      recorded_at: midday,
      client_recorded_at: midday,
      status: 'COMPLETED',
      sync_status: 'SYNCED',
      version: 1,
    });

    await db.payments.put({
      id: 'pay-2',
      business_id: businessId,
      package_id: 'pkg-1',
      amount_minor: 350000, // ₦3,500 Transfer
      method: 'TRANSFER',
      recorded_by_user_id: 1,
      recorded_at: midday,
      client_recorded_at: midday,
      status: 'COMPLETED',
      sync_status: 'SYNCED',
      version: 1,
    });

    // Reversal payment of ₦500
    await db.payments.put({
      id: 'pay-rev',
      business_id: businessId,
      package_id: 'pkg-1',
      amount_minor: -50000,
      method: 'TRANSFER',
      recorded_by_user_id: 1,
      recorded_at: midday,
      client_recorded_at: midday,
      status: 'REVERSED',
      reverses_payment_id: 'pay-2',
      sync_status: 'SYNCED',
      version: 1,
    });

    // Rejected payment (needs attention - must NOT count towards recorded total)
    await db.payments.put({
      id: 'pay-rejected',
      business_id: businessId,
      package_id: 'pkg-1',
      amount_minor: 100000,
      method: 'POS',
      recorded_by_user_id: 1,
      recorded_at: midday,
      client_recorded_at: midday,
      status: 'COMPLETED',
      sync_status: 'NEEDS_ATTENTION',
      version: 1,
    });

    const summary = await DailyOperationsReportRepository.getLocalSummary(businessId, today, 'all', true);
    expect(summary.payments.recordedCount).toBe(2);
    expect(summary.payments.recordedMinor).toBe(550000); // 200k + 350k
    expect(summary.payments.reversedCount).toBe(1);
    expect(summary.payments.reversedMinor).toBe(50000);
    expect(summary.payments.netMinor).toBe(500000); // 550k - 50k
    expect(summary.payments.byMethod.cashMinor).toBe(200000);
    expect(summary.payments.byMethod.transferMinor).toBe(350000);
  });
});
