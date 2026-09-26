import { CreditCard, Check, Minus, Clock, CalendarDays } from 'lucide-react';
import type { LocalPayment } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';
import type { FeeBreakdown } from '@/features/payments/domain/storage-fee';
import { PackagesStrings } from '@/features/packages/strings';
import { formatNaira } from '@/features/packages/domain/package-filters';
import { Section } from '@/design-system/shell/Section';

export interface PackagePaymentCardProps {
  paymentSummary: PaymentSummaryData;
  payments: LocalPayment[];
  packageStatus?: string;
  feeBreakdown?: FeeBreakdown;
}

export function PackagePaymentCard({
  paymentSummary,
  payments,
  packageStatus,
  feeBreakdown,
}: PackagePaymentCardProps) {
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

        {/* Breakdown: Base Drop Fee vs Accrued Demurrage */}
        {feeBreakdown && (
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[var(--pd-page)] border border-[var(--pd-line)] text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--pd-muted)] font-bold">Base Drop Fee:</span>
              <span className="font-extrabold text-[var(--pd-navy)] tabular-nums">
                {formatNaira(feeBreakdown.basePriceMinor)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--pd-muted)] font-bold">
                Demurrage (Storage):
              </span>
              <span className={`font-extrabold tabular-nums ${feeBreakdown.demurrageMinor > 0 ? 'text-[#D97706]' : 'text-[var(--pd-navy)]'}`}>
                {formatNaira(feeBreakdown.demurrageMinor)}
              </span>
            </div>
            {feeBreakdown.extraDays > 0 ? (
              <span className="text-[11px] text-[#D97706] font-semibold">
                {feeBreakdown.extraDays} extra {feeBreakdown.extraDays === 1 ? 'day' : 'days'} held ({formatNaira(feeBreakdown.dailyRateMinor)}/day)
              </span>
            ) : (
              <span className="text-[11px] text-[var(--pd-muted)]">
                Day 1 included (no demurrage accrued)
              </span>
            )}
          </div>
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
  );
}
