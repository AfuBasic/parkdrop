import { Dialog, DialogContent, DialogTitle } from '@/design-system';
import { cn } from '@/lib/utils';
import { AddPackageStrings } from '../strings';

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
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onStay()}>
      <DialogContent className="w-full max-w-[340px] rounded-[var(--pd-card-radius)] p-5">
        <DialogTitle className="text-[20px] font-extrabold text-[var(--pd-navy)] mb-2">
          {AddPackageStrings.discardTitle}
        </DialogTitle>

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
      </DialogContent>
    </Dialog>
  );
}
