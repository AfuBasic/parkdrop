import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HomeStrings } from '../strings';
import type { HomePackageRow } from '../hooks/useHomeData';
import { FilterChips, type HomeFilter } from './FilterChips';
import { ParcelRow } from './ParcelRow';

/** Home shows the five oldest and hands the rest to the Packages screen. */
export const HOME_ROW_LIMIT = 5;

export interface WaitingListProps {
  rows: HomePackageRow[];
  filter: HomeFilter;
  onFilterChange: (filter: HomeFilter) => void;
  onSelectPackage: (packageId: string) => void;
  onSeeAll: () => void;
  className?: string;
}

/**
 * "Waiting for pickup": the five oldest packages, and a way to the rest.
 *
 * Five is a deliberate ceiling. Home answers "how am I doing?"; the
 * Packages screen answers "show me everything". A Home screen that scrolls
 * for a minute stops being a dashboard, and on a cheap phone it also stops
 * being fast.
 */
export function WaitingList({
  rows,
  filter,
  onFilterChange,
  onSelectPackage,
  onSeeAll,
  className,
}: WaitingListProps) {
  const visible = rows.slice(0, HOME_ROW_LIMIT);

  return (
    <section className={cn('flex flex-col gap-3', className)} aria-labelledby="pd-waiting-title">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2
          id="pd-waiting-title"
          className="m-0 text-[var(--pd-size-section)] font-extrabold tracking-[-0.01em] text-[var(--pd-navy)]"
        >
          {HomeStrings.listTitle}
        </h2>
        <FilterChips value={filter} onChange={onFilterChange} />
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] bg-white px-5 py-6">
          <h3 className="m-0 mb-1.5 text-[var(--pd-size-section)] font-extrabold text-[var(--pd-navy)]">
            {HomeStrings.emptyFilterTitle}
          </h3>
          <p className="m-0 text-[var(--pd-size-meta)] font-semibold leading-[1.45] text-[var(--pd-muted)]">
            {HomeStrings.emptyFilterBody}
          </p>
        </div>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col gap-2">
          {visible.map((row) => (
            <li key={row.id}>
              <ParcelRow row={row} onSelect={onSelectPackage} />
            </li>
          ))}
        </ul>
      )}

      {rows.length > visible.length && (
        <button
          type="button"
          onClick={onSeeAll}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 self-start',
            'min-h-[var(--pd-tap-min)] px-4 rounded-[var(--pd-chip-radius)]',
            'text-[var(--pd-size-meta)] font-extrabold text-[var(--pd-blue-hover)]',
            'hover:bg-[var(--pd-tint)] active:scale-[0.98]',
            'transition-[background-color,transform] duration-[var(--pd-motion-fast)]',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
          )}
        >
          {HomeStrings.seeAll(rows.length)}
          <ChevronRight className="w-5 h-5 flex-none" strokeWidth={2.75} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
