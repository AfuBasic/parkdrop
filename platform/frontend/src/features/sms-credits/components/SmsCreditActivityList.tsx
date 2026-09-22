import { Clock } from 'lucide-react';
import type { LocalSmsCreditTransaction } from '@/offline/db/schema';
import { SmsCreditTransactionRow } from './SmsCreditTransactionRow';
import { SmsCreditsStrings } from '@/features/sms-credits/strings';

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
      <div
        role="status"
        className="w-full bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-8 flex flex-col items-center justify-center gap-3"
      >
        <div className="w-6 h-6 border-2 border-[var(--pd-blue)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[15px] text-[var(--pd-muted)] m-0">{SmsCreditsStrings.historyLoading}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="w-full bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-8 flex flex-col items-center justify-center text-center gap-1">
        <div className="w-12 h-12 rounded-full bg-[var(--pd-page-2)] flex items-center justify-center text-[var(--pd-muted)] mb-2">
          <Clock className="w-6 h-6" strokeWidth={2.25} aria-hidden="true" />
        </div>
        <h3 className="text-[16px] font-bold text-[var(--pd-navy)] m-0">
          {SmsCreditsStrings.historyEmpty}
        </h3>
        <p className="text-[15px] text-[var(--pd-muted)] max-w-xs m-0 mt-1">
          {SmsCreditsStrings.historyEmptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] overflow-hidden">
      <div>
        {transactions.map((transaction) => (
          <SmsCreditTransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
}
