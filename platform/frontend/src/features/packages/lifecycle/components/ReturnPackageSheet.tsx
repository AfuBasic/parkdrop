import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';
import {
  type ReturnReason,
  RETURN_REASONS,
} from '@/features/packages/lifecycle/domain/lifecycle-reasons';
import { LifecycleReasonField } from './LifecycleReasonField';
import { ExistingPaymentWarning } from './ExistingPaymentWarning';

interface ReturnPackageSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: LocalPackage;
  customer: LocalCustomer | null;
  paymentSummary: PaymentSummaryData;
  onConfirmReturn: (reason: ReturnReason, note?: string | null) => Promise<void>;
  isOnline?: boolean;
}

export function ReturnPackageSheet({
  isOpen,
  onClose,
  pkg,
  customer,
  paymentSummary,
  onConfirmReturn,
  isOnline = true,
}: ReturnPackageSheetProps) {
  const [selectedReason, setSelectedReason] = useState<ReturnReason | null>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason || isSubmitting) return;

    if (selectedReason === 'OTHER' && !note.trim()) {
      setNoteError('Please provide a reason note');
      return;
    }

    setNoteError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onConfirmReturn(selectedReason, selectedReason === 'OTHER' ? note.trim() : note.trim() || null);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not return package. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-sheet-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface-default rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-2xl)] p-6 shadow-2xl border border-border-subtle flex flex-col gap-5 animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-status-warning-text">
            <RotateCcw className="w-5 h-5 shrink-0" />
            <h2 id="return-sheet-title" className="text-lg font-bold text-text-primary">
              Return package
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-subtle transition-colors cursor-pointer"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity Context */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border-subtle text-xs">
          <div className="flex flex-col">
            <span className="text-text-secondary">Customer</span>
            <span className="font-bold text-sm text-text-primary">
              {customer?.name || 'Customer'}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-text-secondary">Package ID</span>
            <span className="font-mono font-bold text-sm text-text-primary">
              {pkg.public_package_id}
            </span>
          </div>
        </div>

        {/* Existing Payment Warning */}
        <ExistingPaymentWarning
          totalPaidMinor={paymentSummary.paidMinor}
          action="return"
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <LifecycleReasonField<ReturnReason>
            legend="Why is this package being returned?"
            options={RETURN_REASONS}
            selectedReason={selectedReason}
            onSelectReason={(r) => {
              setSelectedReason(r);
              if (noteError) setNoteError(null);
            }}
            note={note}
            onNoteChange={(n) => {
              setNote(n);
              if (noteError) setNoteError(null);
            }}
            noteError={noteError}
            disabled={isSubmitting}
          />

          {submitError && (
            <div className="p-3 rounded-xl bg-status-danger-bg text-status-danger-text text-xs border border-status-danger-border">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-[var(--radius-xl)] border border-border-default font-semibold text-text-secondary hover:bg-surface-subtle transition-colors cursor-pointer text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason || isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-[var(--radius-xl)] bg-status-warning-text hover:bg-status-warning-text/90 active:scale-[0.99] text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isSubmitting ? 'Returning…' : 'Confirm return'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
