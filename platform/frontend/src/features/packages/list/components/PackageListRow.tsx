import { Clock, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNationalDisplay } from '@/features/auth/lib/phone';
import { PackagesStrings } from '../../strings';
import { formatNaira, type PackageCardData } from '../../domain/package-filters';

export interface PackageListRowProps {
  data: PackageCardData;
  onSelect: (pkgId: string) => void;
  showStatusBadge?: boolean;
}

/**
 * Parcel-label card row with minimum 84px touch target:
 * - 6px left edge in age colour for WAITING packages (red for 7+ days, amber for 3-6 days)
 * - Customer name (if present) or formatted phone number (never shown twice)
 * - Right column: Amount in naira (18/800 tabular) + payment chip (Unpaid, Part paid, Paid, Nothing to pay)
 * - Age chip with clock icon ("Today", "Yesterday", "3 days", "8 days")
 * - Public package ID (e.g. PD-MKK89)
 * - Pickup code is strictly excluded from list rows for customer privacy.
 */
export function PackageListRow({
  data,
  onSelect,
  showStatusBadge = false,
}: PackageListRowProps) {
  const { pkg, customerName, customerPhone, paymentState, amountDueMinor, balanceMinor, ageBand, ageDisplay } = data;

  const hasName = Boolean(customerName && customerName.trim().length > 0);
  const displayName = hasName ? customerName!.trim() : formatNationalDisplay(customerPhone || '');
  const displayPhone = hasName && customerPhone ? formatNationalDisplay(customerPhone) : null;

  // Age line left-edge accent colour (Waiting status only)
  const isWaiting = pkg.status === 'WAITING';
  const getAccentBorderClass = () => {
    if (!isWaiting) return 'border-l-transparent';
    switch (ageBand) {
      case 'SEVEN_PLUS':
        return 'border-l-[6px] border-l-[var(--pd-bad)]';
      case 'THREE_TO_SIX':
        return 'border-l-[6px] border-l-[#D97706]';
      case 'TODAY_YESTERDAY':
      default:
        return 'border-l-[6px] border-l-[var(--pd-line)]';
    }
  };

  // Payment Chip
  const renderPaymentChip = () => {
    switch (paymentState) {
      case 'UNPAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
            <span>₦</span>
            <span>{PackagesStrings.paymentUnpaid}</span>
          </span>
        );
      case 'PART_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
            <span>₦</span>
            <span>{PackagesStrings.paymentPartPaid}</span>
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-extrabold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{PackagesStrings.paymentPaid}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-extrabold bg-[var(--pd-page)] text-[var(--pd-muted)] border border-[var(--pd-line)]">
            <Minus className="w-3 h-3" />
            <span>{PackagesStrings.paymentNothingToPay}</span>
          </span>
        );
    }
  };

  // Age Badge Styling
  const getAgeChipClass = () => {
    switch (ageBand) {
      case 'SEVEN_PLUS':
        return 'text-[var(--pd-bad)] bg-[#FEF2F2] border-[#FCA5A5] font-extrabold';
      case 'THREE_TO_SIX':
        return 'text-[#92400E] bg-[#FFFBEB] border-[#FDE68A] font-extrabold';
      case 'TODAY_YESTERDAY':
      default:
        return 'text-[var(--pd-muted)] bg-[var(--pd-page)] border-[var(--pd-line)] font-bold';
    }
  };

  // Display amount: for Unpaid and Part paid, show balance due; else amountDueMinor
  const displayAmountMinor = (paymentState === 'UNPAID' || paymentState === 'PART_PAID') ? balanceMinor : amountDueMinor;

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => onSelect(pkg.id)}
        className={cn(
          'w-full min-h-[84px] text-left p-3.5 bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] shadow-xs flex flex-col gap-1.5 transition-transform active:scale-[0.99] cursor-pointer select-none',
          getAccentBorderClass()
        )}
      >
        {/* Row 1: Name & Amount / Payment Chip */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[18px] font-extrabold text-[var(--pd-navy)] leading-tight truncate">
              {displayName}
            </span>
            {displayPhone && (
              <span className="text-[15px] font-bold text-[var(--pd-muted)] tabular-nums mt-0.5">
                {displayPhone}
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[18px] font-extrabold text-[var(--pd-navy)] tabular-nums">
              {formatNaira(displayAmountMinor)}
            </span>
            {renderPaymentChip()}
          </div>
        </div>

        {/* Row 2: Age Chip, Public Package ID & Sync state */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--pd-line-2)] text-[13px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[13px] tabular-nums',
                getAgeChipClass()
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{ageDisplay}</span>
            </span>

            <span className="font-mono font-extrabold text-[var(--pd-muted)] tracking-wider">
              {pkg.public_package_id}
            </span>

            {showStatusBadge && (
              <span className="px-2 py-0.5 rounded-full text-[12px] font-extrabold bg-[var(--pd-tint)] text-[var(--pd-blue)] border border-[var(--pd-tint-2)]">
                {pkg.status}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
