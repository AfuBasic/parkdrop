import type { DailyPackageMetrics } from '@/features/reports/report-types';
import { ReportsStrings } from '@/features/reports/strings';

interface DailyPackageSummaryProps {
  metrics: DailyPackageMetrics;
  isToday: boolean;
}

export function DailyPackageSummary({ metrics, isToday }: DailyPackageSummaryProps) {
  return (
    <div className="bg-white border border-[var(--pd-line-2)] rounded-[var(--pd-card-radius)] p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[var(--pd-line-2)] pb-2.5">
        <h3 className="text-[16px] font-extrabold text-[var(--pd-navy)] m-0">{ReportsStrings.packagesHeading}</h3>
        {isToday && metrics.waitingNowCount !== null && (
          <span className="text-[15px] font-bold text-[var(--pd-blue)] tabular-nums">
            {ReportsStrings.waitingNow(metrics.waitingNowCount)}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-0.5 p-2 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)]">
          <dt className="text-[15px] text-[var(--pd-muted)] font-semibold">{ReportsStrings.received}</dt>
          <dd className="text-[20px] font-extrabold text-[var(--pd-navy)] tabular-nums m-0">
            {metrics.receivedCount}
          </dd>
        </div>

        <div className="flex flex-col gap-0.5 p-2 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)]">
          <dt className="text-[15px] text-[var(--pd-muted)] font-semibold">{ReportsStrings.collected}</dt>
          <dd className="text-[20px] font-extrabold text-[var(--pd-navy)] tabular-nums m-0">
            {metrics.collectedCount}
          </dd>
        </div>

        <div className="flex flex-col gap-0.5 p-2 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)]">
          <dt className="text-[15px] text-[var(--pd-muted)] font-semibold">{ReportsStrings.returned}</dt>
          <dd className="text-[20px] font-extrabold text-[var(--pd-warn)] tabular-nums m-0">
            {metrics.returnedCount}
          </dd>
        </div>

        <div className="flex flex-col gap-0.5 p-2 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)]">
          <dt className="text-[15px] text-[var(--pd-muted)] font-semibold">{ReportsStrings.cancelled}</dt>
          <dd className="text-[20px] font-extrabold text-[var(--pd-bad)] tabular-nums m-0">
            {metrics.cancelledCount}
          </dd>
        </div>
      </dl>
    </div>
  );
}
