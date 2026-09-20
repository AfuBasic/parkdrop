import { PackageCheck, AlertCircle } from 'lucide-react';
import type { LocalPackage } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';

interface PackageActionSlotsProps {
  pkg: LocalPackage;
  paymentSummary: PaymentSummaryData;
  onOpenRecordPayment?: () => void;
}

export function PackageActionSlots({
  pkg,
  paymentSummary,
}: PackageActionSlotsProps) {
  const isWaiting = pkg.status === 'WAITING';
  const isCollected = pkg.status === 'COLLECTED';

  return (
    <div className="pt-2 pb-6 flex flex-col gap-3">
      {/* Release Package Action Boundary (Build 15 Slot) */}
      {isWaiting && (
        <button
          type="button"
          onClick={() => {
            alert('Package release and collection workflow is scheduled for Build 15.');
          }}
          className="w-full h-13 bg-action-primary hover:bg-action-primary-hover active:scale-[0.99] text-white font-bold rounded-[var(--radius-xl)] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
        >
          <PackageCheck className="w-5 h-5" />
          <span>Release package</span>
        </button>
      )}

      {isCollected && (
        <div className="w-full py-3.5 px-4 bg-status-neutral-bg border border-status-neutral-border rounded-[var(--radius-xl)] text-center text-sm font-semibold text-status-neutral-text">
          Package has already been collected
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
