import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@/design-system';
import { cn } from '@/lib/utils';
import { HomeStrings } from '../strings';
import type { SyncSummary } from '../lib/syncSummary';

export interface SyncSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: SyncSummary;
}

/**
 * What the sync chip means, in two sentences.
 *
 * The fear this answers is "if I close the app, is the customer's package
 * gone?". So the first line is the promise, not the mechanism, and the
 * second says how many packages are still only on this phone — a number,
 * because "some" is what makes people anxious.
 */
export function SyncSheet({ open, onOpenChange, summary }: SyncSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="w-full max-w-[420px] mx-auto p-5 pb-8 rounded-t-[var(--pd-sheet-radius)]"
      >
        <h2 className="m-0 mb-2 pr-10 text-[22px] font-extrabold tracking-[-0.02em] text-[var(--pd-navy)]">
          {HomeStrings.syncSheetTitle}
        </h2>

        <p className="m-0 text-[var(--pd-size-meta)] font-semibold leading-[1.45] text-[var(--pd-muted)]">
          {HomeStrings.syncSheetBody}
        </p>

        <p className="mt-3 mb-5 text-[var(--pd-size-meta)] font-bold leading-[1.45] text-[var(--pd-navy)] tabular-nums">
          {summary.pending > 0
            ? HomeStrings.syncSheetWaiting(summary.pending)
            : HomeStrings.syncSheetAllSent}
        </p>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className={cn(
            'w-full min-h-[var(--pd-tap-min)] rounded-[var(--pd-field-radius)]',
            'inline-flex items-center justify-center gap-2',
            'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-muted)]',
            'hover:bg-[#F1F5F9] active:scale-[0.985]',
            'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
          )}
        >
          <X className="w-5 h-5" strokeWidth={2.75} aria-hidden="true" />
          {HomeStrings.syncSheetClose}
        </button>
      </SheetContent>
    </Sheet>
  );
}
