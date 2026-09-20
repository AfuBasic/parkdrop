import { PlusCircle, CheckCircle2 } from 'lucide-react';
import type { PaymentSummaryData } from '../domain/payment-summary';
import { formatMoney } from '@/lib/formatters';

interface PaymentSummaryCardProps {
  summary: PaymentSummaryData;
  onOpenRecordPayment: () => void;
  canRecordPayment: boolean;
}

export function PaymentSummaryCard({
  summary,
  onOpenRecordPayment,
  canRecordPayment,
}: PaymentSummaryCardProps) {
  const getBadgeStyle = () => {
    switch (summary.paymentState) {
      case 'PAID':
        return 'bg-status-success-bg text-status-success-text border-status-success-border';
      case 'PART_PAID':
        return 'bg-status-warning-bg text-status-warning-text border-status-warning-border';
      case 'UNPAID':
      default:
        return 'bg-status-neutral-bg text-status-neutral-text border-status-neutral-border';
    }
  };

  const getBadgeLabel = () => {
    switch (summary.paymentState) {
      case 'PAID':
        return 'Paid';
      case 'PART_PAID':
        return 'Part paid';
      case 'UNPAID':
      default:
        return 'Unpaid';
    }
  };

  return (
    <div className="bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle p-5 shadow-sm flex flex-col gap-4">
      {/* Header with Title and State Badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-text-primary tracking-tight">Payment</h3>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
        >
          {getBadgeLabel()}
        </span>
      </div>

      {/* Breakdown Rows */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border-subtle text-sm">
        <div className="flex items-center justify-between text-text-secondary">
          <span>Amount due</span>
          <span className="font-semibold text-text-primary tabular-nums">
            {formatMoney(summary.amountDueMinor)}
          </span>
        </div>

        <div className="flex items-center justify-between text-text-secondary">
          <span>Paid</span>
          <span className="font-semibold text-text-primary tabular-nums">
            {formatMoney(summary.paidMinor)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-subtle font-bold text-base">
          <span className="text-text-primary">Balance</span>
          <span className="text-action-primary tabular-nums">
            {formatMoney(summary.balanceMinor)}
          </span>
        </div>
      </div>

      {/* Action CTA */}
      {!summary.isFullyPaid && canRecordPayment && (
        <button
          type="button"
          onClick={onOpenRecordPayment}
          className="w-full h-11 mt-1 bg-action-primary hover:bg-action-primary-hover active:scale-[0.99] text-white font-semibold rounded-[var(--radius-xl)] text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record payment</span>
        </button>
      )}

      {summary.isFullyPaid && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-status-success-bg/60 rounded-[var(--radius-xl)] border border-status-success-border text-status-success-text text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>Fully paid</span>
        </div>
      )}
    </div>
  );
}
