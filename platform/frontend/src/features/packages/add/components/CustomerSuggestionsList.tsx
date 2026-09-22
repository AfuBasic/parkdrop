import { cn } from '@/lib/utils';
import { formatNationalDisplay } from '@/features/auth/lib/phone';
import type { CustomerSuggestion } from '@/features/packages/add/hooks/useCustomerLookup';
import { AddPackageStrings } from '@/features/packages/add/strings';

export interface CustomerSuggestionsListProps {
  suggestions: CustomerSuggestion[];
  onSelect: (suggestion: CustomerSuggestion) => void;
  className?: string;
}

/**
 * Suggestions dropdown list shown while 3 <= digits < 11.
 * Each item has a 64px min-height tap area.
 */
export function CustomerSuggestionsList({
  suggestions,
  onSelect,
  className,
}: CustomerSuggestionsListProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      className={cn(
        'w-full rounded-[var(--pd-field-radius)] border border-[var(--pd-line)] bg-white overflow-hidden shadow-sm',
        className
      )}
      role="listbox"
      aria-label={AddPackageStrings.suggestionsTitle}
    >
      {suggestions.map((item, idx) => (
        <button
          key={item.customer.id}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            'w-full min-h-[64px] px-4 py-2.5 text-left flex items-center justify-between gap-3',
            'hover:bg-[var(--pd-tint)] active:bg-[var(--pd-tint-2)] transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--pd-blue)]',
            idx > 0 && 'border-t border-[var(--pd-line-2)]'
          )}
          role="option"
          aria-selected={false}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[17px] font-extrabold text-[var(--pd-navy)] truncate">
              {item.customer.name}
            </span>
            <span className="pd-nums text-[15px] font-semibold text-[var(--pd-muted)]">
              {formatNationalDisplay(item.customer.phone_display)}
            </span>
          </div>

          <div className="flex-none text-right">
            <span className="text-[15px] font-bold text-[var(--pd-blue-hover)]">
              {item.collectedCount > 0
                ? AddPackageStrings.matchCollectedBefore(item.collectedCount)
                : item.waitingCount > 0
                ? AddPackageStrings.matchHasWaiting(item.waitingCount)
                : ''}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
