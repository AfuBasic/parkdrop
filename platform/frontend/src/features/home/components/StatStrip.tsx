import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/formatters';
import { HomeStrings } from '../strings';
import type { HomeStats } from '../hooks/useHomeData';

export interface StatStripProps {
  stats: HomeStats;
  onOpenWaiting: () => void;
  onOpenUnpaid: () => void;
  onOpenCollected: () => void;
  className?: string;
}

/**
 * How the day is going, in one glance.
 *
 * Transformed from three cramped equal-weight columns into a glanceable hero stat card:
 * - "Waiting" is the hero stat (large, bold, prominent) on a soft tinted card.
 * - "Owed" and "Today" sit side-by-side underneath as secondary stats in subtle tinted tiles.
 * - "Owed" uses warning tone when balance is owed.
 * - "Today" uses ok tone with checkmark when packages have been collected.
 */
export function StatStrip({
  stats,
  onOpenWaiting,
  onOpenUnpaid,
  onOpenCollected,
  className,
}: StatStripProps) {
  const hasOwed = stats.unpaidBalanceMinor > 0;
  const hasCollected = stats.collectedTodayCount > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-3.5',
        'rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)]',
        'bg-gradient-to-b from-[var(--pd-tint)]/60 to-white',
        className
      )}
    >
      {/* Primary Hero Stat: Waiting for pickup */}
      <button
        type="button"
        onClick={onOpenWaiting}
        aria-label={HomeStrings.statWaitingHint}
        className={cn(
          'w-full min-h-[var(--pd-tap-min)] py-3 px-4',
          'flex flex-col items-center justify-center text-center',
          'rounded-[var(--pd-chip-radius)] bg-white/80 border border-[var(--pd-line-2)]',
          'transition-[background-color,transform] duration-[var(--pd-motion-fast)]',
          'hover:bg-white active:scale-[0.99]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
        )}
      >
        <span className="text-[clamp(32px,9vw,44px)] font-black leading-none tracking-[-0.03em] tabular-nums text-[var(--pd-navy)]">
          {stats.waitingCount}
        </span>
        <span className="mt-1 text-[var(--pd-size-meta)] font-bold text-[var(--pd-muted)]">
          {HomeStrings.statWaiting}
        </span>
      </button>

      {/* Secondary Sub-row: Owed & Today */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenUnpaid}
          aria-label={HomeStrings.statOwedHint}
          className={cn(
            'min-h-[var(--pd-tap-min)] px-3 py-2.5 text-left',
            'flex flex-col justify-center gap-0.5',
            'rounded-[var(--pd-chip-radius)] border border-[var(--pd-line-2)] bg-white/70',
            'transition-[background-color,transform] duration-[var(--pd-motion-fast)]',
            'hover:bg-white active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
          )}
        >
          <span className="text-[var(--pd-size-small)] font-bold leading-none text-[var(--pd-muted)]">
            {HomeStrings.statOwed}
          </span>
          <span
            className={cn(
              'font-extrabold leading-tight tabular-nums tracking-[-0.02em]',
              'text-[clamp(15px,4.2vw,18px)] truncate',
              hasOwed ? 'text-[var(--pd-warn)]' : 'text-[var(--pd-navy)]'
            )}
          >
            {formatMoney(stats.unpaidBalanceMinor)}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenCollected}
          aria-label={HomeStrings.statCollectedHint}
          className={cn(
            'min-h-[var(--pd-tap-min)] px-3 py-2.5 text-left',
            'flex flex-col justify-center gap-0.5',
            'rounded-[var(--pd-chip-radius)] border border-[var(--pd-line-2)] bg-white/70',
            'transition-[background-color,transform] duration-[var(--pd-motion-fast)]',
            'hover:bg-white active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
          )}
        >
          <span className="text-[var(--pd-size-small)] font-bold leading-none text-[var(--pd-muted)]">
            {HomeStrings.statCollected}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 font-extrabold leading-tight tabular-nums tracking-[-0.02em]',
              'text-[clamp(15px,4.2vw,18px)]',
              hasCollected ? 'text-[var(--pd-ok)]' : 'text-[var(--pd-navy)]'
            )}
          >
            {stats.collectedTodayCount}
            <Check className="w-4 h-4 flex-none" strokeWidth={3} aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>
  );
}
