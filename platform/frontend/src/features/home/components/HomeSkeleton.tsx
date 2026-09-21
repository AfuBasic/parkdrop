import { cn } from '@/lib/utils';
import { HomeStrings } from '../strings';

const BLOCK = 'rounded-[var(--pd-card-radius)] bg-[#E9EEF5] motion-safe:animate-pulse';

/**
 * The shape of the screen while the local database opens.
 *
 * Deliberately the same boxes at the same sizes as the real content, so
 * nothing moves when the data arrives. On a cheap phone this is usually a
 * single frame; it exists so that when it is not, the screen does not flash
 * an empty state at someone who has 40 packages waiting.
 */
export function HomeSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4', className)} aria-busy="true">
      <span className="sr-only" role="status">
        {HomeStrings.loading}
      </span>

      <div className="flex gap-3" aria-hidden="true">
        <div className={cn(BLOCK, 'flex-1 min-h-[var(--pd-tile-h)]')} />
        <div className={cn(BLOCK, 'flex-1 min-h-[var(--pd-tile-h)]')} />
      </div>

      <div className={cn(BLOCK, 'h-[86px]')} aria-hidden="true" />

      <div className="flex flex-col gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(BLOCK, 'min-h-[var(--pd-row-h)]')} />
        ))}
      </div>
    </div>
  );
}
