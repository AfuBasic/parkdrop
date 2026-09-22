import { formatMoney } from '@/lib/formatters';
import type { DailyPaymentMetrics } from '@/features/reports/report-types';
import { ReportsStrings } from '@/features/reports/strings';

interface DailyPaymentSummaryProps {
  metrics: DailyPaymentMetrics;
}

export function DailyPaymentSummary({ metrics }: DailyPaymentSummaryProps) {
  const hasReversals = metrics.reversedMinor > 0;

  return (
    <div className="bg-white border border-[var(--pd-line-2)] rounded-[var(--pd-card-radius)] p-4 shadow-sm flex flex-col gap-3">
      <div className="border-b border-[var(--pd-line-2)] pb-2.5">
        <h3 className="text-[16px] font-extrabold text-[var(--pd-navy)] m-0">{ReportsStrings.paymentsHeading}</h3>
      </div>

      <dl className="flex flex-col gap-2">
        <div className="flex items-center justify-between py-1 border-b border-[var(--pd-line-2)]">
          <dt className="text-[15px] text-[var(--pd-muted)] font-semibold">{ReportsStrings.paymentsRecorded}</dt>
          <dd className="font-extrabold text-[var(--pd-navy)] text-[16px] tabular-nums m-0">
            {formatMoney(metrics.recordedMinor)}
          </dd>
        </div>

        {hasReversals && (
          <div className="flex items-center justify-between py-1 border-b border-[var(--pd-line-2)]">
            <dt className="text-[15px] text-[var(--pd-bad)] font-semibold">{ReportsStrings.reversals}</dt>
            <dd className="font-extrabold text-[var(--pd-bad)] text-[16px] tabular-nums m-0">
              -{formatMoney(metrics.reversedMinor)}
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between py-1.5 bg-[var(--pd-page-2)] px-2 rounded-[var(--pd-field-radius)]">
          <dt className="text-[var(--pd-navy)] font-bold text-[15px]">{ReportsStrings.netActivity}</dt>
          <dd className="font-extrabold text-[var(--pd-blue)] text-[18px] tabular-nums m-0">
            {formatMoney(metrics.netMinor)}
          </dd>
        </div>
      </dl>

      <div className="pt-2 border-t border-[var(--pd-line-2)] flex flex-col gap-1.5">
        <span className="text-[15px] font-bold text-[var(--pd-muted)]">{ReportsStrings.byMethod}</span>
        <dl className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-2 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)]">
            <dt className="text-[15px] text-[var(--pd-muted)] font-semibold">{ReportsStrings.cash}</dt>
            <dd className="font-bold text-[var(--pd-navy)] text-[15px] tabular-nums m-0">
              {formatMoney(metrics.byMethod.cashMinor)}
            </dd>
          </div>

          <div className="flex items-center justify-between p-2 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)]">
            <dt className="text-[15px] text-[var(--pd-muted)] font-semibold">{ReportsStrings.transfer}</dt>
            <dd className="font-bold text-[var(--pd-navy)] text-[15px] tabular-nums m-0">
              {formatMoney(metrics.byMethod.transferMinor)}
            </dd>
          </div>

          <div className="flex items-center justify-between p-2 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)]">
            <dt className="text-[15px] text-[var(--pd-muted)] font-semibold">{ReportsStrings.pos}</dt>
            <dd className="font-bold text-[var(--pd-navy)] text-[15px] tabular-nums m-0">
              {formatMoney(metrics.byMethod.posMinor)}
            </dd>
          </div>

          <div className="flex items-center justify-between p-2 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)]">
            <dt className="text-[15px] text-[var(--pd-muted)] font-semibold">{ReportsStrings.other}</dt>
            <dd className="font-bold text-[var(--pd-navy)] text-[15px] tabular-nums m-0">
              {formatMoney(metrics.byMethod.otherMinor)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
