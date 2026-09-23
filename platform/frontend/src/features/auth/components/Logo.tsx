import { cn } from '@/lib/utils';

/**
 * The ParkDrop lockup: the existing cube-with-pin mark plus the wordmark.
 *
 * The mark is the shipped asset, used as-is. It is never redrawn, stretched,
 * recoloured or given effects — on a blue header it sits inside a white
 * rounded square so it keeps its own colours instead of being knocked out.
 */
export interface LogoProps {
  /** 'blue' for the header, 'light' for white backgrounds. */
  tone?: 'blue' | 'light';
  /** Hide the wordmark and show the mark alone. */
  markOnly?: boolean;
  className?: string;
}

const MARK_SRC = '/parkdrop-icon-only.png';

export function Logo({ tone = 'blue', markOnly = false, className }: LogoProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-2.5', className)}
      role="img"
      aria-label="ParkDrop"
    >
      <span
        className={cn(
          'grid place-items-center flex-none w-[38px] h-[38px] rounded-[11px] overflow-hidden',
          // On blue the mark needs a white plate to stay legible and keep its
          // own colours. On light it sits directly on the page.
          tone === 'blue' ? 'bg-white' : 'bg-transparent'
        )}
      >
        <img
          src={MARK_SRC}
          alt=""
          aria-hidden="true"
          width={26}
          height={26}
          className="w-[26px] h-[26px] object-contain"
          // The mark is above the fold on the first screen.
          fetchPriority="high"
          decoding="async"
        />
      </span>

      {!markOnly && (
        <span
          className={cn(
            'font-extrabold tracking-[-0.02em] text-[20px] leading-none',
            tone === 'blue' ? 'text-white' : 'text-[var(--pd-navy)]'
          )}
        >
          ParkDrop
        </span>
      )}
    </span>
  );
}
