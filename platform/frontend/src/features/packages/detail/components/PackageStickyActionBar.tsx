import { useState } from 'react';
import { PackageCheck, CheckCircle2, RotateCcw, Ban, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/design-system';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';
import { PackagesStrings } from '@/features/packages/strings';
import { formatNaira } from '@/features/packages/domain/package-filters';
import { formatEventDay, formatEventTime } from '@/features/packages/domain/eventTime';

export interface PackageStickyActionBarProps {
  pkg: LocalPackage;
  customer: LocalCustomer | null;
  paymentSummary: PaymentSummaryData;
  onOpenRecordPaymentOnly: () => void;
  onConfirmCollectAndRelease: (pickupCode: string) => Promise<void>;
  onConfirmReleaseWithoutPayment: (pickupCode: string) => Promise<void>;
  onConfirmReleasePaid: (pickupCode: string) => Promise<void>;
  onUndoRelease?: () => Promise<void>;
}

/**
 * Pinned 84px action bar above safe area:
 * - Waiting with balance due: primary "Collect ₦X and release", secondary text "Record payment only"
 * - Waiting paid / ₦0: primary "Release package"
 * - Collected: green banner + check ("Collected on date, time by staff"), "Owing ₦X" if balance due, "Undo release" button
 * - Returned / Cancelled: grey banner with icon and date
 */
export function PackageStickyActionBar({
  pkg,
  customer,
  paymentSummary,
  onOpenRecordPaymentOnly,
  onConfirmCollectAndRelease,
  onConfirmReleaseWithoutPayment,
  onConfirmReleasePaid,
  onUndoRelease,
}: PackageStickyActionBarProps) {
  const [isReleaseSheetOpen, setIsReleaseSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWaiting = pkg.status === 'WAITING';
  const isCollected = pkg.status === 'COLLECTED';
  const isReturned = pkg.status === 'RETURNED';
  const isCancelled = pkg.status === 'CANCELLED';

  const balanceMinor = paymentSummary.balanceMinor;
  const hasBalance = balanceMinor > 0;
  const balanceStr = formatNaira(balanceMinor);

  const displayName = customer?.name || customer?.phone_display || 'Customer';

  // Handle release actions from modal
  const handleCollectAndRelease = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirmCollectAndRelease(pkg.pickup_code);
      setIsReleaseSheetOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseWithoutPayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirmReleaseWithoutPayment(pkg.pickup_code);
      setIsReleaseSheetOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleasePaid = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirmReleasePaid(pkg.pickup_code);
      setIsReleaseSheetOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[var(--pd-line-2)] px-4 py-3 min-h-[84px] flex items-center justify-center shadow-lg">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-1.5">
          {/* WAITING State */}
          {isWaiting && (
            <div className="flex flex-col gap-1 items-center w-full">
              {hasBalance ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsReleaseSheetOpen(true)}
                    className="w-full min-h-[56px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] text-white text-[17px] font-extrabold flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-xs cursor-pointer"
                  >
                    <PackageCheck className="w-5 h-5" />
                    <span>{PackagesStrings.collectAndReleasePrimary(balanceStr)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenRecordPaymentOnly}
                    className="min-h-[44px] px-3 text-[14px] font-extrabold text-[var(--pd-blue)] hover:underline active:scale-95"
                  >
                    {PackagesStrings.recordPaymentOnlyAction}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsReleaseSheetOpen(true)}
                  className="w-full min-h-[56px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] hover:bg-[var(--pd-blue-hover)] text-white text-[18px] font-extrabold flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-xs cursor-pointer"
                >
                  <PackageCheck className="w-5 h-5" />
                  <span>{PackagesStrings.releasePackagePrimary}</span>
                </button>
              )}
            </div>
          )}

          {/* COLLECTED State */}
          {isCollected && (
            <div className="w-full py-2 px-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#15803D] text-[14px] font-extrabold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  {pkg.collected_at
                    ? PackagesStrings.collectedBanner(
                        formatEventDay(pkg.collected_at),
                        formatEventTime(pkg.collected_at),
                        pkg.terminal_actor_name || 'Staff'
                      )
                    : PackagesStrings.collectedBannerNoTime(pkg.terminal_actor_name || 'Staff')}
                </span>
                {hasBalance && (
                  <span className="text-[#92400E] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FCD34D]">
                    {PackagesStrings.owingBanner(balanceStr)}
                  </span>
                )}
              </div>

              {onUndoRelease && (
                <button
                  type="button"
                  onClick={onUndoRelease}
                  className="min-h-[44px] px-2.5 rounded-lg text-[13px] font-extrabold text-[#15803D] hover:bg-[#86EFAC]/30 flex items-center gap-1 active:scale-95 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{PackagesStrings.undoReleaseAction}</span>
                </button>
              )}
            </div>
          )}

          {/* RETURNED State */}
          {isReturned && (
            <div className="w-full py-3 px-4 rounded-xl bg-[var(--pd-page)] border border-[var(--pd-line)] flex items-center gap-2 text-[var(--pd-muted)] font-extrabold text-[15px]">
              <RotateCcw className="w-5 h-5 text-[#D97706]" />
              <span>
                {pkg.returned_at
                  ? PackagesStrings.returnedBanner(formatEventDay(pkg.returned_at))
                  : PackagesStrings.returnedBannerNoDate}
              </span>
            </div>
          )}

          {/* CANCELLED State */}
          {isCancelled && (
            <div className="w-full py-3 px-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-center gap-2 text-[var(--pd-bad)] font-extrabold text-[15px]">
              <Ban className="w-5 h-5" />
              <span>
                {pkg.cancelled_at
                  ? PackagesStrings.cancelledBanner(formatEventDay(pkg.cancelled_at))
                  : PackagesStrings.cancelledBannerNoDate}
              </span>
            </div>
          )}
        </div>
      </footer>

      {/* Release Confirmation Bottom Sheet */}
      <Dialog open={isReleaseSheetOpen} onOpenChange={setIsReleaseSheetOpen}>
        <DialogContent className="w-full max-w-[380px] p-5 rounded-[var(--pd-card-radius)]">
          <DialogTitle className="text-[22px] font-extrabold text-[var(--pd-navy)] mb-1">
            {PackagesStrings.releaseTitle(displayName)}
          </DialogTitle>

          <div className="flex flex-col gap-4">
            {/* Customer pickup code presentation */}
            <div className="p-4 rounded-xl bg-[var(--pd-page)] border border-[var(--pd-line)] flex flex-col items-center gap-1">
              <span className="text-[13px] font-bold text-[var(--pd-muted)]">
                {PackagesStrings.checkCodePrompt}
              </span>
              <span className="font-mono text-[32px] font-extrabold text-[var(--pd-navy)] tracking-widest tabular-nums">
                {pkg.pickup_code}
              </span>
            </div>

            {/* Balance Due Notice if owing */}
            {hasBalance && (
              <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between text-[#92400E]">
                <span className="text-[15px] font-bold">{PackagesStrings.balanceLabel}</span>
                <span className="text-[18px] font-extrabold tabular-nums">{balanceStr}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {hasBalance ? (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCollectAndRelease}
                    className="w-full min-h-[56px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] text-white text-[17px] font-extrabold active:scale-98 transition-transform shadow-xs"
                  >
                    {PackagesStrings.collectAndReleasePrimary(balanceStr)}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleReleaseWithoutPayment}
                    className="w-full min-h-[48px] rounded-[var(--pd-field-radius)] bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] text-[15px] font-extrabold active:scale-98 transition-transform"
                  >
                    {PackagesStrings.releaseWithoutPaymentAction}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReleasePaid}
                  className="w-full min-h-[56px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] text-white text-[18px] font-extrabold active:scale-98 transition-transform shadow-xs"
                >
                  {PackagesStrings.yesReleaseAction}
                </button>
              )}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsReleaseSheetOpen(false)}
                className="min-h-[48px] text-[16px] font-extrabold text-[var(--pd-muted)] hover:text-[var(--pd-navy)]"
              >
                {PackagesStrings.notYetAction}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
