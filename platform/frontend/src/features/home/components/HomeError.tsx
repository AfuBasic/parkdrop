import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HomeStrings } from '../strings';

export interface HomeErrorProps {
  onRetry: () => void;
  className?: string;
}

/**
 * Shown when the packages on this phone cannot be read at all.
 *
 * It says what failed and what to do, and nothing else. There is no error
 * code and no apology: neither helps the person standing at the counter,
 * and a code invites them to read it down a phone line to someone who
 * cannot use it either.
 */
export function HomeError({ onRetry, className }: HomeErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-[var(--pd-card-radius)] border border-[#FECACA] bg-[var(--pd-bad-bg)]',
        'px-5 py-5 flex flex-col items-start gap-4',
        className
      )}
    >
      <p className="m-0 flex items-start gap-2.5 text-[var(--pd-size-body)] font-bold leading-[1.4] text-[var(--pd-bad)]">
        <AlertCircle className="w-[22px] h-[22px] flex-none mt-px" strokeWidth={2.5} aria-hidden="true" />
        <span>{HomeStrings.errorTitle}</span>
      </p>

      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'inline-flex items-center justify-center',
          'min-h-[var(--pd-tap-min)] px-6 rounded-[var(--pd-chip-radius)]',
          'bg-[var(--pd-blue)] text-white',
          'text-[var(--pd-size-meta)] font-extrabold leading-none',
          'hover:bg-[var(--pd-blue-hover)] active:scale-[0.97]',
          'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/35'
        )}
      >
        {HomeStrings.errorAction}
      </button>
    </div>
  );
}
