import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { LocalSmsCreditTransaction } from '@/offline/db/schema';
import { SmsCreditsStrings } from '@/features/sms-credits/strings';

interface SmsCreditTransactionRowProps {
  transaction: LocalSmsCreditTransaction;
}

/** What the transaction was for, in the reader's own words. */
function describeTransaction(transaction: LocalSmsCreditTransaction): string {
  switch (transaction.reference_type) {
    case 'WELCOME_CREDIT':
      return SmsCreditsStrings.welcomeCredits;
    case 'PURCHASE':
      return SmsCreditsStrings.boughtCredits;
    case 'ARRIVAL_SMS':
      return SmsCreditsStrings.packageSms;
    case 'SMS_REFUND':
      return SmsCreditsStrings.refundCredits;
    default:
      return SmsCreditsStrings.packageSms;
  }
}

export function SmsCreditTransactionRow({ transaction }: SmsCreditTransactionRowProps) {
  const isCredit = transaction.type === 'CREDIT';

  const date = new Date(transaction.created_at);
  const formattedDate = !isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : transaction.created_at;

  const title = describeTransaction(transaction);
  const amountText = isCredit
    ? SmsCreditsStrings.smsAdded(transaction.amount)
    : SmsCreditsStrings.smsCount(transaction.amount);

  return (
    <div className="flex items-center justify-between gap-3 py-3.5 px-4 border-b border-[var(--pd-line-2)] last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isCredit
              ? 'bg-[var(--pd-ok-bg)] text-[var(--pd-ok)]'
              : 'bg-[var(--pd-page-2)] text-[var(--pd-muted)]'
          }`}
          aria-hidden="true"
        >
          {isCredit ? <ArrowDownLeft className="w-5 h-5" strokeWidth={2.25} /> : <ArrowUpRight className="w-5 h-5" strokeWidth={2.25} />}
        </div>
        <div className="text-left min-w-0">
          <p className="text-[16px] font-semibold text-[var(--pd-navy)] leading-snug m-0 truncate">
            {title}
          </p>
          <p className="text-[15px] text-[var(--pd-muted)] m-0 mt-0.5">{formattedDate}</p>
        </div>
      </div>

      <span
        className={`text-[16px] font-extrabold shrink-0 ${
          isCredit ? 'text-[var(--pd-ok)]' : 'text-[var(--pd-navy)]'
        }`}
      >
        {amountText}
      </span>
    </div>
  );
}
