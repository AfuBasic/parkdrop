import { ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HomeStrings } from '../strings';

export interface OverdueCardProps {
  overdueCount: number;
  oldestSubline?: string | null;
  onOpenOverdue: () => void;
  className?: string;
}

/**
 * 24h Overdue card on Home.
 *
 * Displays "{count} packages overdue" with subline naming the worst case
 * (e.g. "Oldest waiting 2 days" or "Oldest waiting 28 hours").
 * If count is 0, displays reassuring "Nothing overdue" state.
 * Tapping opens /packages?status=WAITING&age=24h.
 */
export function OverdueCard({
  overdueCount,
  oldestSubline,
  onOpenOverdue,
  className,
}: OverdueCardProps) {
  const hasOverdue = overdueCount > 0;

  return (
    <button
      type="button"
      onClick={onOpenOverdue}
      aria-label={
        hasOverdue
          ? `${HomeStrings.overduePackagesCount(overdueCount)}. ${oldestSubline || ''}`
          : HomeStrings.nothingOverdue
      }
      className={cn(
        'w-full min-h-[56px] px-4 py-3 rounded-[var(--pd-card-radius)] border text-left',
        'flex items-center justify-between gap-3 shadow-xs',
        'transition-[background-color,transform] duration-[var(--pd-motion-fast)] active:scale-[0.99] cursor-pointer',
        hasOverdue
          ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[var(--pd-bad)] hover:bg-[#FEE2E2]'
          : 'bg-white border-[var(--pd-line-2)] text-[var(--pd-navy)] hover:bg-[var(--pd-tint)]',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-none',
            hasOverdue ? 'bg-[#FEE2E2] text-[var(--pd-bad)]' : 'bg-[var(--pd-ok-bg)] text-[var(--pd-ok)]'
          )}
        >
          {hasOverdue ? (
            <Clock className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              'text-[16px] sm:text-[17px] font-extrabold leading-tight truncate',
              hasOverdue ? 'text-[var(--pd-bad)]' : 'text-[var(--pd-navy)]'
            )}
          >
            {hasOverdue ? HomeStrings.overduePackagesCount(overdueCount) : HomeStrings.nothingOverdue}
          </span>
          <span className="text-[14px] font-semibold text-[var(--pd-muted)] leading-tight mt-0.5 truncate">
            {hasOverdue ? oldestSubline : HomeStrings.nothingOverdueSubline}
          </span>
        </div>
      </div>

      <ChevronRight
        className={cn(
          'w-5 h-5 flex-none transition-transform',
          hasOverdue ? 'text-[var(--pd-bad)]' : 'text-[var(--pd-muted)]'
        )}
        strokeWidth={2.75}
        aria-hidden="true"
      />
    </button>
  );
}
