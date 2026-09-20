import { useAuth } from '@/features/auth/AuthContext';
import { useWaitingCount, useUnpaidCount, useCollectedTodayCount } from '@/offline/queries/homeSelectors';

export function OperationalSummary() {
  const { business } = useAuth();
  const waiting = useWaitingCount(business?.id);
  const unpaid = useUnpaidCount(business?.id);
  const collected = useCollectedTodayCount(business?.id);

  return (
    <div className="mb-8 rounded-[var(--radius-xl)] bg-surface-default p-4 shadow-[var(--shadow-elevation-1)] ring-1 ring-border-subtle">
      <div className="grid grid-cols-3 divide-x divide-border-subtle">
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-[var(--text-caption)] font-medium text-text-secondary mb-1">Waiting</span>
          <span className="text-2xl font-bold text-text-primary">{waiting}</span>
        </div>
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-[var(--text-caption)] font-medium text-text-secondary mb-1">Unpaid</span>
          <span className="text-2xl font-bold text-status-warning-text">{unpaid}</span>
        </div>
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-[var(--text-caption)] font-medium text-text-secondary mb-1">Collected</span>
          <span className="text-2xl font-bold text-status-success-text">{collected}</span>
        </div>
      </div>
    </div>
  );
}
