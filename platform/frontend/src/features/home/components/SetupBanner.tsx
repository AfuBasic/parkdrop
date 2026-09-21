import { TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HomeStrings } from '../strings';
import type { PickupIdentity } from '../hooks/usePickupIdentity';

export interface SetupBannerProps {
  missing: NonNullable<PickupIdentity['missing']>;
  onFinishSetup: () => void;
  className?: string;
}

/**
 * Shown under the header until the pickup point and park both have real
 * names.
 *
 * The reason is in the second half of the sentence — customers see it in the
 * SMS — because an attendant will not walk to the settings screen for a
 * cosmetic detail, and will for a text message that goes out with a blank
 * where their park should be. It disappears the moment the name exists.
 */
export function SetupBanner({ missing, onFinishSetup, className }: SetupBannerProps) {
  const message =
    missing === 'point'
      ? HomeStrings.setupPointTitle
      : missing === 'park'
        ? HomeStrings.setupTitle
        : HomeStrings.setupPhoneTitle;

  return (
    <div
      className={cn(
        'flex items-center gap-3 flex-wrap',
        'rounded-[var(--pd-card-radius)] border border-[#FDE68A] bg-[var(--pd-warn-bg)]',
        'px-4 py-3.5',
        className
      )}
    >
      <TriangleAlert
        className="w-5 h-5 flex-none text-[var(--pd-warn)]"
        strokeWidth={2.5}
        aria-hidden="true"
      />

      <p className="m-0 flex-1 min-w-[180px] text-[var(--pd-size-meta)] font-bold leading-[1.35] text-[var(--pd-warn)]">
        {message}
      </p>

      <button
        type="button"
        onClick={onFinishSetup}
        className={cn(
          'flex-none inline-flex items-center justify-center',
          'min-h-[var(--pd-tap-min)] px-5 rounded-[var(--pd-chip-radius)]',
          // Size before colour: tailwind-merge treats every text-* class as
          // one group, so a text-[size] listed after text-white silently
          // deletes the white and the label comes out navy on blue.
          'bg-[var(--pd-blue)] text-[var(--pd-size-small)] font-extrabold leading-none text-white',
          'hover:bg-[var(--pd-blue-hover)] active:scale-[0.97]',
          'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/35'
        )}
      >
        {HomeStrings.setupAction}
      </button>
    </div>
  );
}
