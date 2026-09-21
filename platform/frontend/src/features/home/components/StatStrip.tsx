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

interface ColumnProps {
  label: string;
  hint: string;
  onClick: () => void;
  children: React.ReactNode;
  /** The small line under the figure. */
  sub?: React.ReactNode;
  tone?: 'default' | 'warn' | 'ok';
}

const TONE_TEXT = {
  default: 'text-[var(--pd-navy)]',
  warn: 'text-[var(--pd-warn)]',
  ok: 'text-[var(--pd-ok)]',
} as const;

function Column({ label, hint, onClick, children, sub, tone = 'default' }: ColumnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hint}
      className={cn(
        'flex-1 min-w-0 min-h-[var(--pd-tap-min)]',
        'flex flex-col items-start justify-start gap-1 px-3 py-3 text-left',
        'rounded-[var(--pd-chip-radius)]',
        'transition-[background-color,transform] duration-[var(--pd-motion-fast)]',
        'hover:bg-[var(--pd-tint)] active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
      )}
    >
      <span className="text-[var(--pd-size-small)] font-bold leading-none text-[var(--pd-muted)]">
        {label}
      </span>
      <span
        className={cn(
          'flex items-center gap-1 text-[22px] font-extrabold leading-tight tabular-nums',
          'tracking-[-0.02em] max-w-full truncate',
          TONE_TEXT[tone]
        )}
      >
        {children}
      </span>
      {sub && (
        <span className="text-[var(--pd-size-small)] font-semibold leading-none text-[var(--pd-muted)] tabular-nums truncate max-w-full">
          {sub}
        </span>
      )}
    </button>
  );
}

/**
 * How the day is going, in one glance.
 *
 * Three deliberate choices over what was here before. It is an ordinary
 * white card with a 1px line, like every other card, instead of the heavy
 * black outline that made it look like an error. Unpaid is money still to
 * collect rather than a count, because an attendant cares about the naira
 * and the count is the smaller question — so the count sits underneath it.
 * And "Collected" now says when.
 *
 * Each column is a button into the same list, filtered.
 */
export function StatStrip({
  stats,
  onOpenWaiting,
  onOpenUnpaid,
  onOpenCollected,
  className,
}: StatStripProps) {
  return (
    <div
      className={cn(
        'flex items-stretch gap-1',
        'rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] bg-white',
        'p-1',
        className
      )}
    >
      <Column
        label={HomeStrings.statWaiting}
        hint={HomeStrings.statWaitingHint}
        onClick={onOpenWaiting}
      >
        {stats.waitingCount}
      </Column>

      <Column
        label={HomeStrings.statUnpaid}
        hint={HomeStrings.statUnpaidHint}
        onClick={onOpenUnpaid}
        tone={stats.unpaidBalanceMinor > 0 ? 'warn' : 'default'}
        sub={HomeStrings.statUnpaidCount(stats.unpaidCount)}
      >
        {formatMoney(stats.unpaidBalanceMinor)}
      </Column>

      <Column
        label={HomeStrings.statCollected}
        hint={HomeStrings.statCollectedHint}
        onClick={onOpenCollected}
        tone={stats.collectedTodayCount > 0 ? 'ok' : 'default'}
      >
        {stats.collectedTodayCount}
        <Check className="w-5 h-5 flex-none" strokeWidth={3} aria-hidden="true" />
      </Column>
    </div>
  );
}
