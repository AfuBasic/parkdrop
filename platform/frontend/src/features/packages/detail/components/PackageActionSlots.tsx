import { PackageCheck, AlertCircle, RotateCcw, Ban } from 'lucide-react';
import type { LocalPackage } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';

interface PackageActionSlotsProps {
  pkg: LocalPackage;
  paymentSummary: PaymentSummaryData;
  onOpenRelease?: () => void;
  onOpenRecordPayment?: () => void;
  onOpenReturn?: () => void;
  onOpenCancel?: () => void;
}

export function PackageActionSlots({
  pkg,
  paymentSummary,
  onOpenRelease,
  onOpenReturn,
  onOpenCancel,
}: PackageActionSlotsProps) {
  const isWaiting = pkg.status === 'WAITING';
  const isCollected = pkg.status === 'COLLECTED';
  const isReturned = pkg.status === 'RETURNED';
  const isCancelled = pkg.status === 'CANCELLED';

  return (
    <div className="pt-2 pb-6 flex flex-col gap-3">
      {/* Primary Release Action Boundary */}
      {isWaiting && (
        <button
          type="button"
          onClick={onOpenRelease}
          className="w-full h-13 bg-action-primary hover:bg-action-primary-hover active:scale-[0.99] text-white font-bold rounded-[var(--radius-xl)] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
        >
          <PackageCheck className="w-5 h-5" />
          <span>Release package</span>
        </button>
      )}

      {/* Terminal Secondary Actions for WAITING package */}
      {isWaiting && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenReturn}
            className="flex-1 py-3 px-3 rounded-[var(--radius-xl)] border border-status-warning-border bg-status-warning-bg/40 hover:bg-status-warning-bg text-status-warning-text font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return package</span>
          </button>

          <button
            type="button"
            onClick={onOpenCancel}
            className="flex-1 py-3 px-3 rounded-[var(--radius-xl)] border border-border-default hover:border-status-danger-border hover:bg-status-danger-bg/40 text-text-secondary hover:text-status-danger-text font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Ban className="w-4 h-4" />
            <span>Cancel package</span>
          </button>
        </div>
      )}

      {/* Terminal State Banners */}
      {isCollected && (
        <div className="w-full py-3.5 px-4 bg-status-neutral-bg border border-status-neutral-border rounded-[var(--radius-xl)] text-center text-sm font-semibold text-status-neutral-text">
          Package has already been collected
        </div>
      )}

      {isReturned && (
        <div className="w-full py-3.5 px-4 bg-status-warning-bg border border-status-warning-border rounded-[var(--radius-xl)] text-center text-sm font-semibold text-status-warning-text flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" />
          <span>Package has been returned</span>
        </div>
      )}

      {isCancelled && (
        <div className="w-full py-3.5 px-4 bg-status-danger-bg border border-status-danger-border rounded-[var(--radius-xl)] text-center text-sm font-semibold text-status-danger-text flex items-center justify-center gap-2">
          <Ban className="w-4 h-4" />
          <span>Package has been cancelled</span>
        </div>
      )}

      {/* Notice if unpaid when release is considered */}
      {isWaiting && !paymentSummary.isFullyPaid && (
        <div className="flex items-center gap-2 px-3 py-2 bg-status-warning-bg/40 rounded-xl border border-status-warning-border/60 text-xs text-status-warning-text">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Outstanding balance remaining before release.</span>
        </div>
      )}
    </div>
  );
}
