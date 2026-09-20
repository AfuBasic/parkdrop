import { AlertTriangle, Clock } from 'lucide-react';
import type { LocalPayment } from '@/offline/db/schema';
import { PAYMENT_METHOD_LABELS } from '../domain/payment-summary';
import { formatMoney } from '@/lib/formatters';

interface PaymentRowProps {
  payment: LocalPayment;
}

export function PaymentRow({ payment }: PaymentRowProps) {
  const isReversed = payment.status === 'REVERSED';
  const isNeedsAttention = payment.sync_status === 'NEEDS_ATTENTION';
  const isPendingSync = payment.sync_status === 'PENDING_CREATE';

  const formattedDate = new Date(payment.recorded_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`p-3.5 rounded-[var(--radius-xl)] border flex flex-col gap-1.5 transition-all ${
        isReversed
          ? 'bg-surface-active/40 border-border-subtle opacity-75'
          : isNeedsAttention
          ? 'bg-status-warning-bg/40 border-status-warning-border'
          : 'bg-surface-default border-border-subtle'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`font-bold text-base tabular-nums ${
              isReversed
                ? 'line-through text-text-muted'
                : 'text-text-primary'
            }`}
          >
            {formatMoney(Math.abs(payment.amount_minor))}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-active text-text-secondary font-medium border border-border-subtle">
            {PAYMENT_METHOD_LABELS[payment.method]}
          </span>
          {isReversed && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-status-danger-bg text-status-danger-text font-medium border border-status-danger-border">
              Reversed
            </span>
          )}
        </div>

        <span className="text-xs text-text-muted tabular-nums">
          {formattedDate}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>
          {payment.recorded_by_user_name
            ? `Recorded by ${payment.recorded_by_user_name}`
            : 'Recorded on this device'}
        </span>

        {/* Sync Badges */}
        {isPendingSync && (
          <span className="flex items-center gap-1 text-text-muted font-medium">
            <Clock className="w-3 h-3 text-action-primary" />
            <span>Saved on this device</span>
          </span>
        )}

        {isNeedsAttention && (
          <span className="flex items-center gap-1 text-status-warning-text font-semibold">
            <AlertTriangle className="w-3 h-3" />
            <span>Needs attention</span>
          </span>
        )}
      </div>

      {isNeedsAttention && payment.sync_error && (
        <p className="text-xs text-status-warning-text font-medium mt-1 bg-status-warning-bg p-2 rounded-[var(--radius-lg)] border border-status-warning-border/60">
          {payment.sync_error}
        </p>
      )}
    </div>
  );
}

interface PaymentHistoryProps {
  payments: LocalPayment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) return null;

  return (
    <div className="bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle p-5 shadow-sm flex flex-col gap-3">
      <h3 className="text-base font-bold text-text-primary tracking-tight">Payment history</h3>
      <div className="flex flex-col gap-2.5">
        {payments.map(payment => (
          <PaymentRow key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  );
}
