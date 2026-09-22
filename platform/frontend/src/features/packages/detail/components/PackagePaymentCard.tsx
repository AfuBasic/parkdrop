import { useState } from 'react';
import { CreditCard, Check, Minus, Clock, RefreshCw, X } from 'lucide-react';
import type { LocalPayment, PaymentMethod } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';
import { PackagesStrings } from '@/features/packages/strings';
import { formatNaira } from '@/features/packages/domain/package-filters';
import { Section } from '@/design-system/shell/Section';

export interface PackagePaymentCardProps {
  paymentSummary: PaymentSummaryData;
  payments: LocalPayment[];
  canRecordPayment: boolean;
  onRecordPayment: (amountMinor: number, method: PaymentMethod) => Promise<void>;
  packageStatus?: string;
}

export function PackagePaymentCard({
  paymentSummary,
  payments,
  canRecordPayment,
  onRecordPayment,
  packageStatus,
}: PackagePaymentCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPartPayment, setIsPartPayment] = useState(false);
  const [customAmountNaira, setCustomAmountNaira] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(10);

  const balanceMinor = paymentSummary.balanceMinor;
  const balanceNaira = Math.round(balanceMinor / 100);

  const handleOpenSheet = () => {
    setIsPartPayment(false);
    setCustomAmountNaira('');
    setIsSheetOpen(true);
  };

  const handleRecord = async (amountMinor: number) => {
    if (isSaving || amountMinor <= 0) return;
    setIsSaving(true);
    try {
      await onRecordPayment(amountMinor, 'CASH');
      setIsSheetOpen(false);
      setShowUndoToast(true);
      setUndoCountdown(10);

      const timer = setInterval(() => {
        setUndoCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowUndoToast(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to record payment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(customAmountNaira.replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      const minor = Math.min(balanceMinor, Math.round(parsed * 100));
      handleRecord(minor);
    }
  };

  // Heading chip and label framing:
  // While package is Waiting and nothing paid yet, payment happens at collection point.
  // Neutral "Amount due" framing with no status chip claiming an unpaid exception.
  const isWaitingAndUnpaid = (packageStatus === 'WAITING' || !packageStatus) && paymentSummary.paidMinor === 0 && !paymentSummary.isFullyPaid;

  const cardTitle = isWaitingAndUnpaid ? 'Amount due' : PackagesStrings.paymentCardTitle;

  const statusChip = paymentSummary.isFullyPaid ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[15px] font-extrabold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
      <Check className="w-3.5 h-3.5 stroke-[3]" />
      <span>{PackagesStrings.paymentPaid}</span>
    </span>
  ) : paymentSummary.amountDueMinor === 0 ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[15px] font-extrabold bg-[var(--pd-page)] text-[var(--pd-muted)] border border-[var(--pd-line)]">
      <Minus className="w-3.5 h-3.5" />
      <span>{PackagesStrings.paymentNothingToPay}</span>
    </span>
  ) : paymentSummary.paidMinor > 0 ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[15px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
      <span>₦</span>
      <span>{PackagesStrings.paymentPartPaid}</span>
    </span>
  ) : packageStatus === 'WAITING' || !packageStatus ? (
    // Neutral framing when nothing has been paid yet for a waiting package: no status chip
    null
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[15px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
      <span>₦</span>
      <span>{PackagesStrings.paymentUnpaid}</span>
    </span>
  );

  return (
    <>
      <Section
        icon={<CreditCard className="w-5 h-5 text-[var(--pd-blue)]" />}
        label={cardTitle}
        chip={statusChip}
      >
        <div className="flex flex-col gap-3">
          {/* 3 Metrics: Amount, Paid, Balance */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-[var(--pd-page)] border border-[var(--pd-line-2)] text-center">
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[var(--pd-muted)]">{PackagesStrings.amountLabel}</span>
              <span className="text-[17px] font-extrabold text-[var(--pd-navy)] tabular-nums mt-0.5">
                {formatNaira(paymentSummary.amountDueMinor)}
              </span>
            </div>

            <div className="flex flex-col border-x border-[var(--pd-line)] px-2">
              <span className="text-[15px] font-bold text-[var(--pd-muted)]">{PackagesStrings.paidLabel}</span>
              <span className="text-[17px] font-extrabold text-[#15803D] tabular-nums mt-0.5">
                {formatNaira(paymentSummary.paidMinor)}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[var(--pd-muted)]">{PackagesStrings.balanceLabel}</span>
              <span className="text-[18px] font-extrabold text-[var(--pd-blue)] tabular-nums mt-0.5">
                {formatNaira(paymentSummary.balanceMinor)}
              </span>
            </div>
          </div>

          {/* Record Payment button if balance due and WAITING */}
          {canRecordPayment && balanceMinor > 0 && (
            <button
              type="button"
              onClick={handleOpenSheet}
              className="w-full min-h-[48px] px-4 rounded-[var(--pd-field-radius)] bg-[var(--pd-page)] border border-[var(--pd-line)] hover:border-[var(--pd-blue)] text-[16px] font-extrabold text-[var(--pd-blue)] active:scale-98 transition-transform cursor-pointer"
            >
              {PackagesStrings.recordPaymentAction}
            </button>
          )}

          {/* Payment History List */}
          {payments.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--pd-line-2)]">
              <span className="text-[15px] font-bold text-[var(--pd-muted)] uppercase tracking-wider">
                {PackagesStrings.paymentHistoryTitle}
              </span>
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-[15px]">
                  <div className="flex items-center gap-1 text-[var(--pd-muted)]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(p.recorded_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    {p.recorded_by_user_name && <span>· by {p.recorded_by_user_name}</span>}
                  </div>
                  <span className="font-extrabold text-[#15803D] tabular-nums">
                    +{formatNaira(p.amount_minor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* 10s Undo Toast */}
      {showUndoToast && (
        <div className="fixed bottom-24 inset-x-4 max-w-sm mx-auto z-40 p-3.5 rounded-[var(--pd-card-radius)] bg-[var(--pd-navy)] text-white flex items-center justify-between shadow-lg animate-in fade-in">
          <span className="text-[15px] font-bold">{PackagesStrings.paymentRecordedToast}</span>
          <button
            type="button"
            onClick={() => setShowUndoToast(false)}
            className="px-3 py-1 rounded-md text-[15px] font-extrabold text-[var(--pd-blue-hover)] bg-white/10 hover:bg-white/20 active:scale-95 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{PackagesStrings.undoAction(undoCountdown)}</span>
          </button>
        </div>
      )}

      {/* Record Payment Bottom Sheet Overlay */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-[360px] bg-white rounded-[var(--pd-card-radius)] p-5 shadow-2xl border border-[var(--pd-line)] animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)]">
                {PackagesStrings.recordPaymentTitle}
              </h2>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="p-1.5 -mr-1 text-[var(--pd-muted)] hover:text-[var(--pd-navy)] rounded-full hover:bg-[var(--pd-page)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Quick full balance button */}
              <button
                type="button"
                onClick={() => handleRecord(balanceMinor)}
                disabled={isSaving}
                className="w-full min-h-[52px] px-4 rounded-[var(--pd-field-radius)] bg-[var(--pd-tint)] border border-[var(--pd-blue)] text-[var(--pd-blue)] text-[16px] font-extrabold flex items-center justify-between active:scale-98"
              >
                <span>{PackagesStrings.fullBalanceChip(formatNaira(balanceMinor))}</span>
                <Check className="w-5 h-5 stroke-[3]" />
              </button>

              {/* Part Payment Toggle & Input */}
              <div className="flex flex-col gap-2 pt-1 border-t border-[var(--pd-line-2)]">
                <button
                  type="button"
                  onClick={() => setIsPartPayment(!isPartPayment)}
                  className="text-left text-[15px] font-bold text-[var(--pd-blue)] hover:underline"
                >
                  {PackagesStrings.partPaymentOption}
                </button>

                {isPartPayment && (
                  <div className="flex flex-col gap-3 mt-1">
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-[18px] font-extrabold text-[var(--pd-muted)]">₦</span>
                      <input
                        type="number"
                        aria-label="Amount"
                        inputMode="numeric"
                        min={1}
                        max={balanceNaira}
                        value={customAmountNaira}
                        onChange={(e) => setCustomAmountNaira(e.target.value)}
                        placeholder="0"
                        className="w-full h-[52px] pl-9 pr-3 rounded-[var(--pd-field-radius)] border border-[var(--pd-line)] text-[20px] font-extrabold text-[var(--pd-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--pd-blue)]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCustomSubmit}
                      disabled={isSaving || !customAmountNaira}
                      className="w-full min-h-[52px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] text-white text-[17px] font-extrabold active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {PackagesStrings.recordAmountButton(
                        customAmountNaira ? formatNaira(Number(customAmountNaira) * 100) : formatNaira(0)
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
