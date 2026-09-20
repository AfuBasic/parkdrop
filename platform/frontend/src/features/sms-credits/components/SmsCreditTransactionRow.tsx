import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { LocalSmsCreditTransaction } from '@/offline/db/schema';

interface SmsCreditTransactionRowProps {
  transaction: LocalSmsCreditTransaction;
}

export function SmsCreditTransactionRow({ transaction }: SmsCreditTransactionRowProps) {
  const isCredit = transaction.type === 'CREDIT';

  // Format timestamp nicely
  const date = new Date(transaction.created_at);
  const formattedDate = !isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : transaction.created_at;

  // Human friendly description
  let title = 'SMS Notification';
  let subtitle = transaction.reference_id ? `Ref: ${transaction.reference_id}` : undefined;

  if (transaction.reference_type === 'WELCOME_CREDIT') {
    title = 'Welcome Credits';
    subtitle = 'Account setup bonus';
  } else if (transaction.reference_type === 'PURCHASE') {
    title = 'SMS Credits Purchased';
    subtitle = transaction.reference_id ? `Ref: ${transaction.reference_id}` : 'Direct purchase';
  } else if (transaction.reference_type === 'ARRIVAL_SMS') {
    title = 'Arrival Notification SMS';
    subtitle = transaction.reference_id ? `Package ${transaction.reference_id}` : 'Package notification';
  } else if (transaction.reference_type === 'SMS_REFUND') {
    title = 'SMS Credit Refund';
    subtitle = 'Undelivered SMS returned';
  } else if (transaction.reference_type) {
    title = transaction.reference_type.replace(/_/g, ' ');
  }

  return (
    <div className="flex items-center justify-between py-3.5 px-4 border-b border-border-subtle last:border-b-0 hover:bg-surface-subtle/50 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isCredit ? (
            <ArrowDownLeft className="w-4 h-4" />
          ) : (
            <ArrowUpRight className="w-4 h-4" />
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-text-primary leading-snug">{title}</p>
          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
            <span>{formattedDate}</span>
            {subtitle && (
              <>
                <span>·</span>
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{subtitle}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <span
          className={`text-sm font-bold ${
            isCredit ? 'text-emerald-600' : 'text-text-primary'
          }`}
        >
          {isCredit ? '+' : '-'}{transaction.amount}
        </span>
        <span className="text-xs text-text-muted ml-1">
          {transaction.amount === 1 ? 'credit' : 'credits'}
        </span>
      </div>
    </div>
  );
}
