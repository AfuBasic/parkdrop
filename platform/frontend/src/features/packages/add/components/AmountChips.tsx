import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/formatters';
import { AddPackageStrings } from '../strings';

export interface AmountChipsProps {
  lastAmountMinor: number | null;
  frequentAmountsMinor: number[];
  selectedAmountMinor: number | null;
  onSelectAmount: (minor: number) => void;
  className?: string;
}

/**
 * 48px quick amount chips: "Last ₦X,XXX", frequent amounts, and "Nothing to pay".
 */
export function AmountChips({
  lastAmountMinor,
  frequentAmountsMinor,
  selectedAmountMinor,
  onSelectAmount,
  className,
}: AmountChipsProps) {
  const chips: Array<{ label: string; minor: number }> = [];

  if (lastAmountMinor !== null && lastAmountMinor > 0) {
    chips.push({
      label: `${AddPackageStrings.amountLastPrefix}${formatMoney(lastAmountMinor)}`,
      minor: lastAmountMinor,
    });
  }

  for (const freq of frequentAmountsMinor) {
    if (freq > 0 && freq !== lastAmountMinor) {
      chips.push({
        label: formatMoney(freq),
        minor: freq,
      });
    }
  }

  // Always offer "Nothing to pay" (sets 0)
  chips.push({
    label: AddPackageStrings.amountNothingToPay,
    minor: 0,
  });

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {chips.map((chip) => {
        const isSelected = selectedAmountMinor === chip.minor;
        return (
          <button
            key={chip.label}
            type="button"
            onClick={() => onSelectAmount(chip.minor)}
            className={cn(
              'min-h-[48px] px-3.5 rounded-[var(--pd-chip-radius)] text-[15px] font-extrabold tabular-nums',
              'transition-[background-color,border-color,transform] duration-[var(--pd-motion-fast)] active:scale-[0.97]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-blue)]',
              isSelected
                ? 'bg-[var(--pd-blue)] text-white border-2 border-[var(--pd-blue)]'
                : 'bg-white text-[var(--pd-navy)] border-2 border-[var(--pd-line)] hover:border-[var(--pd-blue)] hover:bg-[var(--pd-tint)]'
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
