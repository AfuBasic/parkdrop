import { formatMoney } from '@/lib/formatters';
import type { DailyPaymentMetrics } from '@/features/reports/report-types';

interface DailyPaymentSummaryProps {
  metrics: DailyPaymentMetrics;
}

export function DailyPaymentSummary({ metrics }: DailyPaymentSummaryProps) {
  const hasReversals = metrics.reversedMinor > 0;

  return (
    <div className="bg-surface-default border border-border-subtle rounded-[var(--radius-xl)] p-4 shadow-xs flex flex-col gap-3">
      <div className="border-b border-border-subtle pb-2.5">
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Payments</h3>
      </div>

      {/* Main Totals */}
      <dl className="flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-border-subtle/50">
          <dt className="text-text-secondary font-medium">Payments recorded</dt>
          <dd className="font-bold text-text-primary text-sm tabular-nums">
            {formatMoney(metrics.recordedMinor)}
          </dd>
        </div>

        {hasReversals && (
          <div className="flex items-center justify-between py-1 border-b border-border-subtle/50">
            <dt className="text-status-danger-text font-medium">Reversals</dt>
            <dd className="font-bold text-status-danger-text text-sm tabular-nums">
              -{formatMoney(metrics.reversedMinor)}
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between py-1 bg-surface-subtle/60 px-2 rounded-lg">
          <dt className="text-text-primary font-semibold">Net payment activity</dt>
          <dd className="font-bold text-action-primary text-base tabular-nums">
            {formatMoney(metrics.netMinor)}
          </dd>
        </div>
      </dl>

      {/* Method Breakdown */}
      <div className="pt-2 border-t border-border-subtle flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          By method
        </span>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-1.5 rounded-md bg-surface-subtle/40">
            <dt className="text-text-secondary">Cash</dt>
            <dd className="font-semibold text-text-primary tabular-nums">
              {formatMoney(metrics.byMethod.cashMinor)}
            </dd>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-md bg-surface-subtle/40">
            <dt className="text-text-secondary">Transfer</dt>
            <dd className="font-semibold text-text-primary tabular-nums">
              {formatMoney(metrics.byMethod.transferMinor)}
            </dd>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-md bg-surface-subtle/40">
            <dt className="text-text-secondary">POS</dt>
            <dd className="font-semibold text-text-primary tabular-nums">
              {formatMoney(metrics.byMethod.posMinor)}
            </dd>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-md bg-surface-subtle/40">
            <dt className="text-text-secondary">Other</dt>
            <dd className="font-semibold text-text-primary tabular-nums">
              {formatMoney(metrics.byMethod.otherMinor)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
