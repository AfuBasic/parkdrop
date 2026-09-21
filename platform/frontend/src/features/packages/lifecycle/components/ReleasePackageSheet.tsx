import { useState } from 'react';
import { X, PackageCheck, AlertCircle, CreditCard } from 'lucide-react';
import type { LocalPackage, LocalCustomer } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';

interface ReleasePackageSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: LocalPackage;
  customer: LocalCustomer | null;
  paymentSummary: PaymentSummaryData;
  onConfirmRelease: (pickupCode: string, notes?: string | null) => Promise<void>;
  onOpenRecordPayment?: () => void;
  isOnline?: boolean;
}

export function ReleasePackageSheet({
  isOpen,
  onClose,
  pkg,
  customer,
  paymentSummary,
  onConfirmRelease,
  onOpenRecordPayment,
  isOnline = true,
}: ReleasePackageSheetProps) {
  const [enteredCode, setEnteredCode] = useState('');
  const [notes, setNotes] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedEntered = enteredCode.trim().toUpperCase();
    const expectedCode = pkg.pickup_code.trim().toUpperCase();

    if (!trimmedEntered) {
      setCodeError('Please enter the customer\'s pickup code');
      return;
    }

    if (trimmedEntered !== expectedCode) {
      setCodeError('Pickup code does not match this package');
      return;
    }

    setCodeError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onConfirmRelease(trimmedEntered, notes.trim() || null);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not collect package. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface-default rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-2xl)] border border-border-subtle shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-sheet-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-page/50">
          <div className="flex items-center gap-2 text-action-primary">
            <PackageCheck className="w-5 h-5" />
            <h2 id="release-sheet-title" className="font-bold text-text-primary text-base sm:text-lg">
              Collect & Release Package
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex flex-col gap-4">
          {/* Customer & Package Overview */}
          <div className="p-3 bg-surface-page rounded-xl border border-border-subtle flex flex-col gap-1 text-sm">
            <div className="flex justify-between items-center text-xs text-text-secondary">
              <span>Package ID: <strong className="font-mono text-text-primary">{pkg.public_package_id}</strong></span>
              <span>Status: <strong className="text-status-warning-text font-semibold">{pkg.status}</strong></span>
            </div>
            {customer && (
              <div className="text-text-primary font-medium mt-1">
                Customer: {customer.name} ({customer.phone_display})
              </div>
            )}
          </div>

          {/* Payment Status Warning if not fully paid */}
          {!paymentSummary.isFullyPaid && (
            <div className="p-3.5 bg-status-warning-bg/50 border border-status-warning-border rounded-xl flex flex-col gap-2.5">
              <div className="flex items-start gap-2 text-status-warning-text text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Outstanding balance due</p>
                  <p className="mt-0.5">
                    This package has an unpaid balance of ₦{(paymentSummary.balanceMinor / 100).toLocaleString()}.
                  </p>
                </div>
              </div>
              {onOpenRecordPayment && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecordPayment();
                  }}
                  className="w-full py-2.5 px-3 bg-white border border-status-warning-border hover:bg-status-warning-bg text-status-warning-text font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record payment now</span>
                </button>
              )}
            </div>
          )}

          {/* Pickup Code Verification Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pickup-code-input" className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Enter customer pickup code <span className="text-status-danger-text">*</span>
            </label>
            <input
              id="pickup-code-input"
              type="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
              value={enteredCode}
              onChange={(e) => {
                setEnteredCode(e.target.value.toUpperCase());
                if (codeError) setCodeError(null);
              }}
              placeholder="e.g. 7-character code"
              className="w-full h-12 px-4 rounded-xl border border-border-default font-mono text-xl tracking-widest text-center uppercase focus:border-action-primary focus:ring-1 focus:ring-action-primary outline-none transition-all"
              required
            />
            {codeError && (
              <p className="text-xs font-medium text-status-danger-text mt-1">{codeError}</p>
            )}
            <p className="text-[11px] text-text-muted">
              Ask the collecting customer to read or show the code sent to their phone.
            </p>
          </div>

          {/* Optional Attendant Notes */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="release-notes" className="text-xs font-medium text-text-secondary">
              Collection note (optional)
            </label>
            <input
              id="release-notes"
              type="text"
              maxLength={150}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Collected by brother, ID verified"
              className="w-full h-10 px-3 rounded-lg border border-border-default text-sm text-text-primary focus:border-action-primary outline-none transition-all"
            />
          </div>

          {/* Offline notice */}
          {!isOnline && (
            <p className="text-[11px] text-text-muted text-center">
              Offline mode: This collection will be saved locally on this device and synced when connected.
            </p>
          )}

          {/* Error Banner */}
          {submitError && (
            <div className="p-3 bg-status-danger-bg text-status-danger-text text-xs rounded-xl border border-status-danger-border font-medium">
              {submitError}
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 pb-1 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !enteredCode.trim()}
              className="w-full h-12 bg-action-primary hover:bg-action-primary-hover disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-sm min-h-[48px]"
            >
              <PackageCheck className="w-5 h-5" />
              <span>{isSubmitting ? 'Confirming collection...' : 'Confirm package collected'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full py-2.5 text-text-secondary hover:text-text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
