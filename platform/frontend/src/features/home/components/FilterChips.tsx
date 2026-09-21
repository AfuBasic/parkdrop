import { cn } from '@/lib/utils';
import { HomeStrings } from '../strings';

export type HomeFilter = 'all' | 'unpaid';

export interface FilterChipsProps {
  value: HomeFilter;
  onChange: (value: HomeFilter) => void;
  className?: string;
}

const OPTIONS: Array<{ id: HomeFilter; label: string }> = [
  { id: 'all', label: HomeStrings.filterAll },
  { id: 'unpaid', label: HomeStrings.filterUnpaid },
];

/**
 * Two filters, not five.
 *
 * "Which of these still owes me money" is the only question an attendant
 * asks of this list that the list does not already answer by being sorted
 * oldest first. Every further filter would be a choice to make in front of a
 * waiting customer.
 */
export function FilterChips({ value, onChange, className }: FilterChipsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} role="group">
      {OPTIONS.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center justify-center flex-none',
              'min-h-[var(--pd-tap-min)] px-4 rounded-[var(--pd-chip-radius)]',
              'text-[var(--pd-size-small)] font-bold leading-none',
              'transition-[background-color,transform] duration-[var(--pd-motion-fast)]',
              'active:scale-[0.97]',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30',
              active
                ? 'bg-[var(--pd-blue)] text-white'
                : 'bg-white text-[var(--pd-muted)] border border-[var(--pd-line-2)] hover:bg-[var(--pd-tint)]'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
