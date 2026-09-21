import React from 'react';

interface PendingBusinessSummary {
  businessId: number;
  count: number;
}

interface SignOutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignOutAnyway: () => void;
  onSyncAndSignOut: () => void;
  pendingCount: number;
  pendingBusinesses: PendingBusinessSummary[];
  isSyncing?: boolean;
}

export const SignOutConfirmDialog: React.FC<SignOutConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirmSignOutAnyway,
  onSyncAndSignOut,
  pendingCount,
  pendingBusinesses,
  isSyncing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200/80 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-3 text-amber-600">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 id="signout-dialog-title" className="text-base font-bold text-neutral-900">
              Unsynced Work on Device
            </h3>
            <span className="text-xs text-amber-700 font-medium">
              {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed mb-3">
          This device has changes recorded while offline that have not yet uploaded to the cloud across{' '}
          {pendingBusinesses.length > 1
            ? `${pendingBusinesses.length} workplaces`
            : 'your workplace'}
          .
        </p>

        {pendingBusinesses.length > 1 && (
          <div className="mb-4 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 space-y-1.5 text-xs text-neutral-600">
            {pendingBusinesses.map((b) => (
              <div key={b.businessId} className="flex justify-between items-center">
                <span className="font-medium text-neutral-800">Business #{b.businessId}</span>
                <span className="font-bold text-amber-700">{b.count} pending</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 pt-2">
          {/* Option 1: Sync and Sign Out */}
          <button
            type="button"
            onClick={onSyncAndSignOut}
            disabled={isSyncing}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Syncing changes...</span>
              </>
            ) : (
              <span>Sync now and sign out</span>
            )}
          </button>

          {/* Option 2: Sign Out Anyway (Preserves local DB queue safely) */}
          <button
            type="button"
            onClick={onConfirmSignOutAnyway}
            disabled={isSyncing}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200/80 transition-colors"
          >
            Sign out anyway (Keep local queue)
          </button>

          {/* Option 3: Cancel */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-700 active:bg-neutral-100 transition-colors"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
};
