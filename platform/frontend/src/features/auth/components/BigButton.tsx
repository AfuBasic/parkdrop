import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BigButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  /**
   * Show the spinner and the waiting label, and swallow further taps.
   * This is the ONLY reason this button ever stops responding.
   */
  busy?: boolean;
  /** Word shown beside the spinner, e.g. "Sending your code…". */
  busyLabel?: string;
  variant?: 'primary' | 'secondary';
}

/**
 * The one primary action, always in the same place at the foot of the sheet.
 *
 * Deliberately never rendered greyed out. A pale disabled button reads as
 * "broken" or "you are not allowed", and gives no clue what is missing — so
 * instead the button always looks tappable, and tapping with bad input shows
 * an error that says exactly what to fix. The only non-responsive state is
 * `busy`, which exists so a double tap cannot send two codes.
 */
export const BigButton = React.forwardRef<HTMLButtonElement, BigButtonProps>(
  ({ busy = false, busyLabel, variant = 'primary', className, children, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Guard against the double tap rather than against invalid input.
      if (busy) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        onClick={handleClick}
        aria-busy={busy || undefined}
        className={cn(
          'w-full min-h-[var(--pd-button-h)] px-5 rounded-[var(--pd-field-radius)]',
          'inline-flex items-center justify-center gap-2.5',
          'text-[var(--pd-size-button)] font-extrabold leading-tight tracking-[-0.01em]',
          'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/35 focus-visible:ring-offset-2',
          // Press state is the only unprompted motion.
          'active:scale-[0.985]',
          variant === 'primary'
            ? 'bg-[var(--pd-blue)] text-white hover:bg-[var(--pd-blue-hover)]'
            : 'bg-[var(--pd-tint)] text-[var(--pd-blue-hover)] border-2 border-[var(--pd-tint-2)] hover:bg-[var(--pd-tint-2)]',
          busy && 'cursor-progress',
          className
        )}
        {...props}
      >
        {busy && <Loader2 className="w-5 h-5 flex-none animate-spin" strokeWidth={2.75} />}
        <span>{busy && busyLabel ? busyLabel : children}</span>
      </button>
    );
  }
);

BigButton.displayName = 'BigButton';
