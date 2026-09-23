import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import type { LocalSmsCreditTransaction } from '@/offline/db/schema';
import { SmsCreditsStrings } from '@/features/sms-credits/strings';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';
import { formatPhone } from '@/lib/formatters';
import { Link } from '@tanstack/react-router';

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
  const isArrivalSms = transaction.reference_type === 'ARRIVAL_SMS' && transaction.reference_id != null;

  // We only fetch the package if it's an arrival SMS and we have a reference ID.
  // Note: Since dexie-react-hooks sometimes returns undefined while loading,
  // we could have a flash of "Package no longer available".
  // But dexie is local and practically instantaneous, so we accept this for now.
  const packageWithCustomer = useLiveQuery(
    async () => {
      if (!isArrivalSms || !transaction.reference_id) return undefined;
      const pkg = await db.packages.get(transaction.reference_id);
      if (!pkg) return null;
      const cust = pkg.customer_id ? await db.customers.get(pkg.customer_id) : null;
      return { pkg, cust };
    },
    [isArrivalSms, transaction.reference_id]
  );

  // Determine title text
  let title = describeTransaction(transaction);
  let isDeletedPackage = false;

  if (isArrivalSms) {
    if (packageWithCustomer) {
      const { cust, pkg } = packageWithCustomer;
      if (cust?.name) {
        title = cust.name;
      } else if (cust?.phone_display) {
        title = formatPhone(cust.phone_display);
      } else if (pkg.creator_name) {
        title = pkg.creator_name;
      } else {
        title = SmsCreditsStrings.packageSms;
      }
    } else if (packageWithCustomer === null) {
      // If package explicitly not found, mark as deleted
      title = SmsCreditsStrings.packageDeleted;
      isDeletedPackage = true;
    }
  }

  const date = new Date(transaction.created_at);
  const formattedDate = !isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : transaction.created_at;

  const amountText = isCredit
    ? SmsCreditsStrings.smsAdded(transaction.amount)
    : SmsCreditsStrings.smsCount(transaction.amount);

  const isTappable = isArrivalSms && !isDeletedPackage && packageData != null;

  const innerContent = (
    <>
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

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-[16px] font-extrabold ${
            isCredit ? 'text-[var(--pd-ok)]' : 'text-[var(--pd-navy)]'
          }`}
        >
          {amountText}
        </span>
        {isTappable && (
          <ChevronRight className="w-5 h-5 text-[var(--pd-muted)]" aria-hidden="true" />
        )}
      </div>
    </>
  );

  const containerClasses = "flex items-center justify-between gap-3 py-3.5 px-4 border-b border-[var(--pd-line-2)] last:border-b-0 w-full text-left";

  if (isTappable && transaction.reference_id) {
    return (
      <Link
        to="/packages/$packageId"
        params={{ packageId: transaction.reference_id }}
        className={`${containerClasses} active:bg-[var(--pd-page-2)] transition-colors`}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <div className={containerClasses}>
      {innerContent}
    </div>
  );
}
