import type { LocalPayment, PaymentMethod } from '../../../offline/db/schema';

export type PaymentState = 'UNPAID' | 'PART_PAID' | 'PAID';

export interface PaymentSummaryData {
  amountDueMinor: number;
  paidMinor: number;
  balanceMinor: number;
  paymentState: PaymentState;
  isFullyPaid: boolean;
  paymentCount: number;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  TRANSFER: 'Transfer',
  POS: 'POS',
  OTHER: 'Other',
};

/**
 * Derives payment state and totals authoritatively from integer minor units.
 * Overpayment is not allowed; balance is clamped at >= 0.
 */
export function calculatePaymentSummary(
  amountDueMinor: number,
  payments: LocalPayment[]
): PaymentSummaryData {
  const safeDueMinor = Math.max(0, Math.floor(amountDueMinor || 0));

  // Only valid completed payments (excluding reversed or server rejected items) contribute to net paid
  const validPayments = payments.filter(
    p => p.status === 'COMPLETED' && p.sync_status !== 'NEEDS_ATTENTION'
  );

  const totalPaidMinor = validPayments.reduce((acc, p) => acc + (p.amount_minor || 0), 0);
  const netPaidMinor = Math.max(0, Math.floor(totalPaidMinor));
  const balanceMinor = Math.max(0, safeDueMinor - netPaidMinor);

  let paymentState: PaymentState = 'UNPAID';
  if (safeDueMinor === 0 || netPaidMinor >= safeDueMinor) {
    paymentState = 'PAID';
  } else if (netPaidMinor > 0) {
    paymentState = 'PART_PAID';
  }

  return {
    amountDueMinor: safeDueMinor,
    paidMinor: netPaidMinor,
    balanceMinor,
    paymentState,
    isFullyPaid: paymentState === 'PAID',
    paymentCount: validPayments.length,
  };
}
