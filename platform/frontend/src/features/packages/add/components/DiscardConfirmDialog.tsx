
import { cn } from '@/lib/utils';
import { AddPackageStrings } from '@/features/packages/add/strings';

export interface DiscardConfirmDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

/**
 * Confirmation dialog when attempting to close the Add Package form with entered data.
 */
export function DiscardConfirmDialog({
  open,
  onStay,
  onLeave,
}: DiscardConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onStay}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[340px] bg-white rounded-[var(--pd-card-radius)] p-5 shadow-2xl border border-[var(--pd-line)] animate-in zoom-in-95 duration-150"
      >
        <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)] mb-2">
          {AddPackageStrings.discardTitle}
        </h2>

        <p className="text-[15px] font-semibold text-[var(--pd-muted)] mb-6 leading-[1.4]">
          {AddPackageStrings.discardBody}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onStay}
            className={cn(
              'flex-1 min-h-[48px] px-4 rounded-[var(--pd-field-radius)]',
              'bg-[var(--pd-tint)] text-[var(--pd-blue-hover)] font-extrabold text-[16px]',
              'hover:bg-[var(--pd-tint-2)] active:scale-[0.98] transition-transform'
            )}
          >
            {AddPackageStrings.discardStay}
          </button>

          <button
            type="button"
            onClick={onLeave}
            className={cn(
              'flex-1 min-h-[48px] px-4 rounded-[var(--pd-field-radius)]',
              'bg-[var(--pd-bad)] text-white font-extrabold text-[16px]',
              'hover:bg-[#991B1B] active:scale-[0.98] transition-transform'
            )}
          >
            {AddPackageStrings.discardLeave}
          </button>
        </div>
      </div>
    </div>
  );
}
