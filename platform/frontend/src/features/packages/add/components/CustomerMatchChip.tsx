import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddPackageStrings } from '@/features/packages/add/strings';
import type { CustomerSuggestion } from '@/features/packages/add/hooks/useCustomerLookup';

export interface CustomerMatchChipProps {
  match: CustomerSuggestion;
  onChangeRequested: () => void;
  className?: string;
}

/**
 * Match chip shown when a returning customer is identified by 11 digits.
 * Displays check icon, name, history note, and a 48px 'Change' tap target.
 */
export function CustomerMatchChip({
  match,
  onChangeRequested,
  className,
}: CustomerMatchChipProps) {
  const historyNote =
    match.collectedCount > 0
      ? AddPackageStrings.matchCollectedBefore(match.collectedCount)
      : match.waitingCount > 0
      ? AddPackageStrings.matchHasWaiting(match.waitingCount)
      : null;

  return (
    <div
      className={cn(
        'w-full min-h-[58px] px-4 py-2.5 rounded-[var(--pd-field-radius)]',
        'bg-[var(--pd-ok-bg)] border border-[#BBF7D0]',
        'flex items-center justify-between gap-3',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="grid place-items-center w-8 h-8 rounded-full bg-[#BBF7D0] text-[var(--pd-ok)] flex-none">
          <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[17px] font-extrabold text-[var(--pd-navy)] truncate">
            {match.customer.name}
          </span>
          {historyNote && (
            <span className="text-[15px] font-semibold text-[var(--pd-muted)]">
              {historyNote}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onChangeRequested}
        className={cn(
          'flex-none min-h-[48px] px-3 -mr-2',
          'inline-flex items-center justify-center',
          'text-[15px] font-extrabold text-[var(--pd-blue-hover)] hover:underline',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-blue)] rounded-lg'
        )}
      >
        {AddPackageStrings.matchChange}
      </button>
    </div>
  );
}
