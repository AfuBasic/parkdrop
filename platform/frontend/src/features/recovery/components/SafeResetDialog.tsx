import React from 'react';

interface SafeResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
  unsyncedCount: number;
  isResetting?: boolean;
}

export const SafeResetDialog: React.FC<SafeResetDialogProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  unsyncedCount,
  isResetting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200/80 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-3 text-rose-600">
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/60">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 id="reset-dialog-title" className="text-base font-bold text-neutral-900">
              Reset Data on This Device
            </h3>
            <span className="text-xs text-rose-600 font-semibold">
              Permanent Local Action
            </span>
          </div>
        </div>

        {unsyncedCount > 0 ? (
          <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed space-y-1">
            <p className="font-bold">
              Warning: {unsyncedCount} unsynced {unsyncedCount === 1 ? 'change is' : 'changes are'} saved only on this device.
            </p>
            <p>
              Resetting will permanently discard these unsynced records. Your business data on the server remains untouched.
            </p>
          </div>
        ) : (
          <p className="text-xs text-neutral-600 leading-relaxed mb-4">
            This will clear local cached packages, customers, and payments on this device. Your business data in the cloud is completely safe and will be re-downloaded next time you sign in.
          </p>
        )}

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onConfirmReset}
            disabled={isResetting}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            {isResetting ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Resetting device data...</span>
              </>
            ) : (
              <span>Reset data on this device</span>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-neutral-600 hover:text-neutral-800 active:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
