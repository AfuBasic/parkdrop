import { cn } from '@/lib/utils';
import { AuthStrings } from '../strings';

export interface ProgressBarsProps {
  /** 1-based. */
  step: number;
  total?: number;
  /** Hide the "Step X of Y" line, e.g. when the keyboard is open. */
  compact?: boolean;
  /** Replaces the step counter entirely, e.g. "Reset your PIN". */
  labelOverride?: string;
  className?: string;
}

/**
 * Five bars plus "Step X of 5".
 *
 * The words matter more than the bars: five small bars alone leave someone
 * guessing how much is left, and "Step 2 of 5" answers the question the brief
 * is really about — how much longer is this. The bars are the glanceable
 * version of the same fact, so they are hidden from screen readers to avoid
 * reading the same thing twice.
 */
export function ProgressBars({
  step,
  total = 6,
  compact,
  labelOverride,
  className,
}: ProgressBarsProps) {
  return (
    <div className={cn('w-full', className)}>
      {!compact && (
        <p className="m-0 mb-2 text-[var(--pd-size-helper)] font-extrabold text-white">
          {labelOverride ?? AuthStrings.stepOf(step, total)}
        </p>
      )}

      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={labelOverride ?? AuthStrings.stepOf(step, total)}
      >
        {Array.from({ length: total }).map((_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              'flex-1 h-2 rounded-full transition-colors duration-[var(--pd-motion-slow)]',
              // Full white, never reduced opacity, so it stays legible on blue.
              index < step ? 'bg-white' : 'bg-white/35'
            )}
          />
        ))}
      </div>
    </div>
  );
}
