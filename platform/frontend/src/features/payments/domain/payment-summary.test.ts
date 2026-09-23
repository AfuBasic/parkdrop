import { describe, it, expect } from 'vitest';
import { calculatePaymentSummary } from './payment-summary';
import type { LocalPayment } from '@/offline/db/schema';

describe('calculatePaymentSummary', () => {
  const createPayment = (amountMinor: number, status: 'COMPLETED' | 'REVERSED' = 'COMPLETED', syncStatus: any = 'SYNCED'): LocalPayment => ({
    id: 'pay-1',
    business_id: 1,
    package_id: 'pkg-1',
    amount_minor: amountMinor,
    method: 'CASH',
    recorded_by_user_id: 1,
    recorded_at: new Date().toISOString(),
    client_recorded_at: new Date().toISOString(),
    status,
    sync_status: syncStatus,
    version: 1,
  });

  it('correctly marks zero payments as UNPAID', () => {
    const summary = calculatePaymentSummary(350000, []);
    expect(summary.amountDueMinor).toBe(350000);
    expect(summary.paidMinor).toBe(0);
    expect(summary.balanceMinor).toBe(350000);
    expect(summary.paymentState).toBe('UNPAID');
    expect(summary.isFullyPaid).toBe(false);
  });

  it('correctly derives PART_PAID state', () => {
    const payments = [createPayment(100000)];
    const summary = calculatePaymentSummary(350000, payments);
    expect(summary.paidMinor).toBe(100000);
    expect(summary.balanceMinor).toBe(250000);
    expect(summary.paymentState).toBe('PART_PAID');
    expect(summary.isFullyPaid).toBe(false);
  });

  it('correctly derives PAID when exact amount is met', () => {
    const payments = [
      createPayment(100000),
      { ...createPayment(250000), id: 'pay-2' },
    ];
    const summary = calculatePaymentSummary(350000, payments);
    expect(summary.paidMinor).toBe(350000);
    expect(summary.balanceMinor).toBe(0);
    expect(summary.paymentState).toBe('PAID');
    expect(summary.isFullyPaid).toBe(true);
  });

  it('treats 0 due package as PAID', () => {
    const summary = calculatePaymentSummary(0, []);
    expect(summary.paymentState).toBe('PAID');
    expect(summary.balanceMinor).toBe(0);
    expect(summary.isFullyPaid).toBe(true);
  });

  it('ignores REVERSED payments in calculation', () => {
    const payments = [
      createPayment(100000, 'COMPLETED'),
      createPayment(100000, 'REVERSED'),
    ];
    const summary = calculatePaymentSummary(350000, payments);
    expect(summary.paidMinor).toBe(100000);
    expect(summary.balanceMinor).toBe(250000);
    expect(summary.paymentState).toBe('PART_PAID');
  });

  it('ignores payments in NEEDS_ATTENTION sync state', () => {
    const payments = [
      createPayment(100000, 'COMPLETED', 'SYNCED'),
      createPayment(50000, 'COMPLETED', 'NEEDS_ATTENTION'),
    ];
    const summary = calculatePaymentSummary(350000, payments);
    expect(summary.paidMinor).toBe(100000);
    expect(summary.balanceMinor).toBe(250000);
  });
});
