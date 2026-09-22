import { useState } from 'react';
import { ArrowLeft, MoreVertical, RotateCcw, Ban, X, SendHorizontal } from 'lucide-react';
import type { LocalPackage } from '@/offline/db/schema';
import { PackagesStrings } from '@/features/packages/strings';

export interface PackageIdentityHeaderProps {
  pkg: LocalPackage;
  onBack: () => void;
  isMoreSheetOpen?: boolean;
  onOpenMoreChange?: (open: boolean) => void;
  onMarkReturned?: () => void;
  onCancelPackage?: () => void;
  onResendSms?: () => void;
}

/**
 * Compact blue header:
 * - 48px Back touch target
 * - Centered public package ID (e.g. PD-MKK89)
 * - 48px "More" button for WAITING packages with bottom sheet for Return/Cancel
 */
export function PackageIdentityHeader({
  pkg,
  onBack,
  isMoreSheetOpen: controlledIsOpen,
  onOpenMoreChange,
  onMarkReturned,
  onCancelPackage,
  onResendSms,
}: PackageIdentityHeaderProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isMoreOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setMoreOpen = (open: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(open);
    }
    onOpenMoreChange?.(open);
  };
  const isWaiting = pkg.status === 'WAITING';

  return (
    <>
      <header className="sticky top-0 z-20 bg-[var(--pd-blue)] px-4 py-3 flex items-center justify-between text-white shadow-xs">
        {/* Left: 48px Back Action */}
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] px-2 -ml-2 text-white/90 hover:text-white flex items-center gap-1.5 text-[16px] font-extrabold active:scale-95 transition-transform"
          aria-label={PackagesStrings.backAction}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{PackagesStrings.backAction}</span>
        </button>

        {/* Center: Title = Package ID */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[20px] font-extrabold tracking-wider tabular-nums">
            {pkg.public_package_id}
          </span>
        </div>

        {/* Right: 48px More Button */}
        {isWaiting ? (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="min-h-[48px] px-2.5 -mr-2 text-white/90 hover:text-white flex items-center gap-1 text-[15px] font-extrabold active:scale-95 transition-transform"
            aria-label={PackagesStrings.moreActions}
          >
            <MoreVertical className="w-5 h-5" />
            <span>{PackagesStrings.moreActions}</span>
          </button>
        ) : (
          <div className="w-12" />
        )}
      </header>

      {/* More Actions Bottom Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-actions-title"
            className="relative z-10 w-full max-w-[340px] bg-white rounded-[var(--pd-card-radius)] p-5 shadow-2xl border border-[var(--pd-line)] animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="more-actions-title" className="text-[20px] font-extrabold text-[var(--pd-navy)]">
                {PackagesStrings.moreActions}
              </h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1.5 -mr-1 text-[var(--pd-muted)] hover:text-[var(--pd-navy)] rounded-full hover:bg-[var(--pd-page)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col divide-y divide-[var(--pd-line-2)]">
              {onResendSms && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    onResendSms();
                  }}
                  disabled={pkg.sync_status !== 'SYNCED'}
                  className="w-full min-h-[56px] px-3 flex items-center gap-3 text-left text-[16px] font-extrabold text-[var(--pd-navy)] hover:bg-[var(--pd-page)] active:scale-98 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SendHorizontal className="w-5 h-5 text-[var(--pd-blue)]" />
                  <div className="flex flex-col">
                    <span>{PackagesStrings.resendSmsAction}</span>
                    {pkg.sync_status !== 'SYNCED' && (
                      <span className="text-[12px] text-[var(--pd-muted)] font-normal">Package is syncing...</span>
                    )}
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onMarkReturned?.();
                }}
                className="w-full min-h-[56px] px-3 flex items-center gap-3 text-left text-[16px] font-extrabold text-[var(--pd-navy)] hover:bg-[var(--pd-page)] active:scale-98 transition-transform cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 text-[#D97706]" />
                <span>{PackagesStrings.markAsReturnedAction}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onCancelPackage?.();
                }}
                className="w-full min-h-[56px] px-3 flex items-center gap-3 text-left text-[16px] font-extrabold text-[var(--pd-bad)] hover:bg-[#FEF2F2] active:scale-98 transition-transform cursor-pointer"
              >
                <Ban className="w-5 h-5 text-[var(--pd-bad)]" />
                <span>{PackagesStrings.cancelEnteredByMistakeAction}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
