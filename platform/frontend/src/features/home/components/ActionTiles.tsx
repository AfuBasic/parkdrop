import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HomeStrings } from '../strings';

export interface ActionTilesProps {
  onAddPackage: () => void;
  onFindPackage: () => void;
  className?: string;
}

const TILE_BASE = cn(
  'flex-1 min-w-0 min-h-[var(--pd-tile-h)]',
  'flex flex-col items-start justify-center gap-0.5',
  'rounded-[var(--pd-tile-radius)] px-4 py-4 text-left',
  'transition-transform duration-[var(--pd-motion-fast)] active:scale-[0.98]',
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2'
);

/**
 * The two jobs that repeat all day, side by side, in the first place the
 * thumb lands.
 *
 * These are the only two things on this screen that create work, and there
 * is now exactly one Add control in the whole app shell — the floating "+"
 * in the bottom bar and the button inside the empty state are both gone, so
 * "where do I add a package?" has a single answer.
 *
 * The 15px sublines are what make the pair usable by someone on their first
 * day: the labels say what the buttons do, the sublines say when to reach
 * for each one.
 */
export function ActionTiles({ onAddPackage, onFindPackage, className }: ActionTilesProps) {
  return (
    <div className={cn('flex gap-3 items-stretch', className)}>
      <button
        type="button"
        onClick={onAddPackage}
        className={cn(
          TILE_BASE,
          'bg-[var(--pd-blue)] text-white',
          'hover:bg-[var(--pd-blue-hover)]',
          'focus-visible:ring-[var(--pd-blue)]/35',
          // A tinted border keeps the tile from dissolving into the blue
          // header it overlaps.
          'border-2 border-[var(--pd-blue-dark)]/25'
        )}
      >
        <Plus className="w-7 h-7 mb-1.5 flex-none" strokeWidth={2.75} aria-hidden="true" />
        <span className="text-[var(--pd-size-tile)] font-extrabold leading-[1.15] tracking-[-0.01em]">
          {HomeStrings.addTitle}
        </span>
        <span className="text-[var(--pd-size-small)] font-semibold leading-tight text-white">
          {HomeStrings.addSubline}
        </span>
      </button>

      <button
        type="button"
        onClick={onFindPackage}
        className={cn(
          TILE_BASE,
          'bg-white text-[var(--pd-navy)]',
          'border-2 border-[var(--pd-blue)]',
          'hover:bg-[var(--pd-tint)]',
          'focus-visible:ring-[var(--pd-blue)]/35'
        )}
      >
        <Search
          className="w-7 h-7 mb-1.5 flex-none text-[var(--pd-blue)]"
          strokeWidth={2.75}
          aria-hidden="true"
        />
        <span className="text-[var(--pd-size-tile)] font-extrabold leading-[1.15] tracking-[-0.01em]">
          {HomeStrings.findTitle}
        </span>
        <span className="text-[var(--pd-size-small)] font-semibold leading-tight text-[var(--pd-muted)]">
          {HomeStrings.findSubline}
        </span>
      </button>
    </div>
  );
}
