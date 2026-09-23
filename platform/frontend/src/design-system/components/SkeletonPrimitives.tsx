import { cn } from '@/lib/utils';

/**
 * A value that hasn't been confirmed from the server yet must never be
 * rendered as if it were a confirmed answer — that's the bug these exist to
 * prevent (see the SMS Credits "false zero" incident: a balance that hadn't
 * loaded yet defaulted to 0 and triggered the real "you have no SMS left"
 * warning banner, before the real balance had arrived).
 *
 * These are shape placeholders, not a generic spinner: build a skeleton
 * VERSION of the real layout (same card shapes, same line lengths/positions)
 * so nothing reflows once real data arrives. Reserve a plain spinner for
 * full-page/full-modal blocking actions that have no natural shape (e.g.
 * "Saving…") — not for content that has an obvious layout.
 */

interface SkeletonLineProps {
  /** Tailwind width class, e.g. "w-24", "w-full". */
  width?: string;
  /** Tailwind height class. Defaults to a text-line height. */
  height?: string;
  className?: string;
}

export function SkeletonLine({ width = 'w-full', height = 'h-4', className }: SkeletonLineProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn('pd-skeleton rounded-full', width, height, className)}
    />
  );
}

interface SkeletonBlockProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonBlock({ width = 'w-full', height = 'h-20', className }: SkeletonBlockProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn('pd-skeleton rounded-[var(--pd-card-radius)]', width, height, className)}
    />
  );
}

interface SkeletonCircleProps {
  /** Tailwind size class applied to both width and height, e.g. "size-10". */
  size?: string;
  className?: string;
}

export function SkeletonCircle({ size = 'size-10', className }: SkeletonCircleProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn('pd-skeleton rounded-full', size, className)}
    />
  );
}
