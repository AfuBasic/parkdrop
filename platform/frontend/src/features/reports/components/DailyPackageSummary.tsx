import type { DailyPackageMetrics } from '@/features/reports/report-types';

interface DailyPackageSummaryProps {
  metrics: DailyPackageMetrics;
  isToday: boolean;
}

export function DailyPackageSummary({ metrics, isToday }: DailyPackageSummaryProps) {
  return (
    <div className="bg-surface-default border border-border-subtle rounded-[var(--radius-xl)] p-4 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Packages</h3>
        {isToday && metrics.waitingNowCount !== null && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-action-primary border border-blue-200 tabular-nums">
            Waiting now: {metrics.waitingNowCount}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-surface-subtle/50">
          <dt className="text-text-secondary font-medium">Received</dt>
          <dd className="text-lg font-bold text-text-primary tabular-nums">
            {metrics.receivedCount}
          </dd>
        </div>

        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-surface-subtle/50">
          <dt className="text-text-secondary font-medium">Collected</dt>
          <dd className="text-lg font-bold text-text-primary tabular-nums">
            {metrics.collectedCount}
          </dd>
        </div>

        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-surface-subtle/50">
          <dt className="text-text-secondary font-medium">Returned</dt>
          <dd className="text-lg font-bold text-status-warning-text tabular-nums">
            {metrics.returnedCount}
          </dd>
        </div>

        <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-surface-subtle/50">
          <dt className="text-text-secondary font-medium">Cancelled</dt>
          <dd className="text-lg font-bold text-status-danger-text tabular-nums">
            {metrics.cancelledCount}
          </dd>
        </div>
      </dl>
    </div>
  );
}
