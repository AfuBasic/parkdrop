import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/database';
import { PaymentRepository } from './PaymentRepository';

describe('PaymentRepository', () => {
  beforeEach(async () => {
    await db.payments.clear();
    await db.mutations.clear();
  });

  it('records a payment locally and enqueues RECORD_PAYMENT mutation', async () => {
    const payment = await PaymentRepository.recordPayment({
      businessId: 1,
      pickupPointId: 2,
      packageId: 'pkg-123',
      amountMinor: 150000,
      method: 'CASH',
      recordedByUserId: 5,
      recordedByUserName: 'Ada',
    });

    expect(payment.id).toBeDefined();
    expect(payment.amount_minor).toBe(150000);
    expect(payment.method).toBe('CASH');
    expect(payment.status).toBe('COMPLETED');
    expect(payment.sync_status).toBe('PENDING_CREATE');

    // Verify stored in Dexie payments table
    const stored = await db.payments.get(payment.id);
    expect(stored).toBeDefined();
    expect(stored?.amount_minor).toBe(150000);

    // Verify mutation queued
    const mutations = await db.mutations.toArray();
    const paymentMutations = mutations.filter(m => m.operation === 'RECORD_PAYMENT');
    expect(paymentMutations).toHaveLength(1);
    expect(paymentMutations[0].payload.payment_id).toBe(payment.id);
    expect(paymentMutations[0].payload.package_id).toBe('pkg-123');
    expect(paymentMutations[0].payload.amount_minor).toBe(150000);
  });

  it('fetches payments for a package sorted newest first with deterministic tie breaker', async () => {
    const now = Date.now();
    await PaymentRepository.recordPayment({
      businessId: 1,
      pickupPointId: null,
      packageId: 'pkg-123',
      amountMinor: 100000,
      method: 'TRANSFER',
      clientRecordedAt: new Date(now - 10000).toISOString(),
    });

    await PaymentRepository.recordPayment({
      businessId: 1,
      pickupPointId: null,
      packageId: 'pkg-123',
      amountMinor: 200000,
      method: 'POS',
      clientRecordedAt: new Date(now).toISOString(),
    });

    // Foreign business payment
    await PaymentRepository.recordPayment({
      businessId: 2,
      pickupPointId: null,
      packageId: 'pkg-123',
      amountMinor: 50000,
      method: 'CASH',
    });

    const results = await PaymentRepository.getByPackageId(1, 'pkg-123');
    expect(results).toHaveLength(2);
    expect(results[0].amount_minor).toBe(200000); // newest first
    expect(results[1].amount_minor).toBe(100000);
  });
});
