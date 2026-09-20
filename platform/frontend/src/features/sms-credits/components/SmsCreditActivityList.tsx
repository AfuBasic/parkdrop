import { Clock } from 'lucide-react';
import type { LocalSmsCreditTransaction } from '@/offline/db/schema';
import { SmsCreditTransactionRow } from './SmsCreditTransactionRow';

interface SmsCreditActivityListProps {
  transactions: LocalSmsCreditTransaction[];
  isLoading?: boolean;
}

export function SmsCreditActivityList({
  transactions,
  isLoading = false,
}: SmsCreditActivityListProps) {
  if (isLoading) {
    return (
      <div className="w-full bg-surface-default rounded-[var(--radius-xl)] border border-border-subtle p-8 flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-action-primary border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-text-muted">Loading SMS activity…</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="w-full bg-surface-default rounded-[var(--radius-xl)] border border-border-subtle p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center text-text-muted mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">No SMS activity yet</h3>
        <p className="text-xs text-text-muted max-w-xs mt-1">
          When you register packages with arrival SMS notifications, credit usage will be recorded here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-default rounded-[var(--radius-xl)] border border-border-subtle shadow-sm overflow-hidden">
      <div className="divide-y divide-border-subtle">
        {transactions.map((transaction) => (
          <SmsCreditTransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
}
