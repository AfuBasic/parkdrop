import { AlertTriangle } from 'lucide-react';
import { formatMoney } from '@/lib/formatters';

interface ExistingPaymentWarningProps {
  totalPaidMinor: number;
  action: 'return' | 'cancel';
}

export function ExistingPaymentWarning({ totalPaidMinor, action }: ExistingPaymentWarningProps) {
  if (totalPaidMinor <= 0) return null;

  return (
    <div
      role="alert"
      className="p-3.5 rounded-xl bg-status-warning-bg border border-status-warning-border flex items-start gap-3 text-status-warning-text text-xs leading-relaxed"
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-status-warning-text" />
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-sm">
          Payment of {formatMoney(totalPaidMinor)} already recorded
        </span>
        <span className="text-status-warning-text/90">
          {action === 'return' ? 'Returning' : 'Cancelling'} this package will not alter or refund recorded payment history.
        </span>
      </div>
    </div>
  );
}
