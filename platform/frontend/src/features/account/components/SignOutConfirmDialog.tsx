import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { AccountStrings } from '@/features/account/strings';

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
      <div className="bg-white rounded-[var(--pd-sheet-radius)] max-w-sm w-full p-5 shadow-xl border border-[var(--pd-line-2)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-[var(--pd-warn-bg)] border border-[var(--pd-warn)]/25 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-[var(--pd-warn)]" strokeWidth={2.25} aria-hidden="true" />
          </div>
          <div>
            <h3 id="signout-dialog-title" className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0">
              {AccountStrings.pendingTitle}
            </h3>
            <span className="text-[15px] font-semibold text-[var(--pd-warn)]">
              {AccountStrings.pendingCount(pendingCount)}
            </span>
          </div>
        </div>

        <p className="text-[16px] font-semibold text-[var(--pd-muted)] leading-relaxed mb-4 m-0">
          {AccountStrings.pendingBody(pendingBusinesses.length)}
        </p>

        {pendingBusinesses.length > 1 && (
          <div className="mb-4 p-3 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)] border border-[var(--pd-line-2)] flex flex-col gap-1.5">
            {pendingBusinesses.map((b) => (
              <div key={b.businessId} className="text-[15px] font-semibold text-[var(--pd-navy)]">
                {AccountStrings.pendingBusinessLine(b.businessId, b.count)}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-1">
          <button
            type="button"
            onClick={onSyncAndSignOut}
            disabled={isSyncing}
            className="w-full min-h-[60px] rounded-[var(--pd-field-radius)] text-[20px] font-extrabold text-white bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSyncing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{AccountStrings.syncing}</span>
              </>
            ) : (
              <span>{AccountStrings.syncAndSignOut}</span>
            )}
          </button>

          <button
            type="button"
            onClick={onConfirmSignOutAnyway}
            disabled={isSyncing}
            className="w-full min-h-[56px] rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-warn)] text-[18px] font-extrabold text-[var(--pd-warn)] cursor-pointer disabled:opacity-50"
          >
            {AccountStrings.signOutAnyway}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="w-full min-h-[48px] text-[17px] font-extrabold text-[var(--pd-blue)] cursor-pointer"
          >
            {AccountStrings.staySignedIn}
          </button>
        </div>
      </div>
    </div>
  );
};
