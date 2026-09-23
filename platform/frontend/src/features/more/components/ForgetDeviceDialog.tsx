import { MoreStrings } from '@/features/more/strings';

interface ForgetDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  mode: 'signOut' | 'forget';
}

export function ForgetDeviceDialog({
  open,
  onOpenChange,
  onConfirm,
  mode,
}: ForgetDeviceDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[360px] bg-white rounded-[var(--pd-card-radius)] p-5 shadow-2xl border border-[var(--pd-line)] animate-in zoom-in-95 duration-150"
      >
        <h2 className="text-[22px] font-extrabold text-[var(--pd-navy)] m-0 leading-tight">
          {mode === 'forget' ? MoreStrings.forgetTitle : MoreStrings.signOutTitle}
        </h2>
        <p className="text-[18px] font-semibold text-[var(--pd-muted)] m-0 mt-3 leading-snug">
          {mode === 'forget' ? MoreStrings.forgetBody : MoreStrings.signOutBody}
        </p>
        
        {/* Additional clear warning if forgetting device */}
        {mode === 'forget' && (
          <p className="text-[15px] font-bold text-[var(--pd-bad)] m-0 mt-4 leading-snug bg-[var(--pd-bad-bg)] p-3 rounded-[8px] border border-[var(--pd-bad)]/20">
            You'll need your phone number and a new code to sign in again on this device.
          </p>
        )}

        <div className="flex flex-col gap-3 mt-5">
          {/* The safe choice is the primary button. */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full min-h-[56px] px-4 rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] text-[18px] font-extrabold text-white hover:bg-[var(--pd-blue-hover)] active:scale-[0.99] transition-all cursor-pointer"
          >
            {MoreStrings.stay}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full min-h-[56px] px-4 rounded-[var(--pd-field-radius)] border border-[var(--pd-bad)]/30 bg-[var(--pd-bad-bg)] text-[18px] font-extrabold text-[var(--pd-bad)] hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
          >
            {mode === 'forget' ? MoreStrings.forgetMe : MoreStrings.signOut}
          </button>
        </div>
      </div>
    </div>
  );
}
