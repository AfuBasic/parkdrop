import { useState } from 'react';
import { ArrowLeft, MoreVertical, RotateCcw, Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/design-system';
import type { LocalPackage } from '@/offline/db/schema';
import { PackagesStrings } from '@/features/packages/strings';

export interface PackageIdentityHeaderProps {
  pkg: LocalPackage;
  onBack: () => void;
  isOnline: boolean;
  onMarkReturned?: () => void;
  onCancelPackage?: () => void;
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
  onMarkReturned,
  onCancelPackage,
}: PackageIdentityHeaderProps) {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
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
            onClick={() => setIsMoreSheetOpen(true)}
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
      <Dialog open={isMoreSheetOpen} onOpenChange={setIsMoreSheetOpen}>
        <DialogContent className="w-full max-w-[360px] p-5 rounded-[var(--pd-card-radius)]">
          <DialogTitle className="text-[20px] font-extrabold text-[var(--pd-navy)] mb-3">
            {PackagesStrings.moreActions}
          </DialogTitle>

          <div className="flex flex-col divide-y divide-[var(--pd-line-2)]">
            <button
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onMarkReturned?.();
              }}
              className="w-full min-h-[56px] px-3 flex items-center gap-3 text-left text-[16px] font-extrabold text-[var(--pd-navy)] hover:bg-[var(--pd-page)] active:scale-98 transition-transform"
            >
              <RotateCcw className="w-5 h-5 text-[#D97706]" />
              <span>{PackagesStrings.markAsReturnedAction}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onCancelPackage?.();
              }}
              className="w-full min-h-[56px] px-3 flex items-center gap-3 text-left text-[16px] font-extrabold text-[var(--pd-bad)] hover:bg-[#FEF2F2] active:scale-98 transition-transform"
            >
              <Ban className="w-5 h-5 text-[var(--pd-bad)]" />
              <span>{PackagesStrings.cancelEnteredByMistakeAction}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
