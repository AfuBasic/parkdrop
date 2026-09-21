import { Phone, MessageSquare, User, Clock, Check, Minus } from 'lucide-react';
import type { LocalCustomer, LocalPackage } from '@/offline/db/schema';
import type { PaymentSummaryData } from '@/features/payments/domain/payment-summary';
import { formatNationalDisplay } from '@/features/auth/lib/phone';
import { PackagesStrings } from '../strings';
import { formatAgeDisplay, getAgeBand } from '../domain/package-filters';

export interface PackageCustomerCardProps {
  customer: LocalCustomer | null;
  pkg: LocalPackage;
  paymentSummary: PaymentSummaryData;
}

/**
 * Summary card overlapping the blue header:
 * - Customer name (24/800) or formatted phone; phone under name
 * - User icon instead of an initial when there is no name (never a phone digit)
 * - 56px touch target buttons: "Call" and "WhatsApp"
 * - Chip row: Status, Payment, Age
 */
export function PackageCustomerCard({
  customer,
  pkg,
  paymentSummary,
}: PackageCustomerCardProps) {
  const hasName = Boolean(customer?.name && customer.name.trim().length > 0);
  const rawPhone = customer?.phone_display || customer?.phone_normalized || '';
  const displayPhone = formatNationalDisplay(rawPhone);
  const displayName = hasName ? customer!.name.trim() : displayPhone;

  // Phone action URLs
  const cleanDigits = rawPhone.replace(/\D/g, '');
  const telUrl = cleanDigits ? `tel:${cleanDigits.startsWith('0') ? cleanDigits : `0${cleanDigits}`}` : null;

  const intlPhone = cleanDigits.startsWith('0')
    ? `234${cleanDigits.slice(1)}`
    : cleanDigits.startsWith('234')
    ? cleanDigits
    : `234${cleanDigits}`;

  const whatsappUrl = cleanDigits
    ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(
        `Hello ${displayName}, your package (${pkg.public_package_id}) is ready for pickup.`
      )}`
    : null;

  // Age calculation
  const ageDisplay = formatAgeDisplay(pkg.client_created_at);
  const ageBand = getAgeBand(Math.floor((Date.now() - new Date(pkg.client_created_at).getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-4 shadow-sm flex flex-col gap-3 -mt-2">
      {/* Name and Phone */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[var(--pd-tint)] text-[var(--pd-blue)] flex items-center justify-center shrink-0 border border-[var(--pd-tint-2)]">
          {hasName ? (
            <span className="text-[20px] font-extrabold uppercase">
              {displayName.charAt(0)}
            </span>
          ) : (
            <User className="w-6 h-6 stroke-[2.5]" />
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <h2 className="text-[22px] sm:text-[24px] font-extrabold text-[var(--pd-navy)] leading-tight truncate m-0">
            {displayName}
          </h2>
          {hasName && (
            <span className="text-[16px] font-bold text-[var(--pd-muted)] tabular-nums mt-0.5">
              {displayPhone}
            </span>
          )}
        </div>
      </div>

      {/* 56px Call & WhatsApp Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--pd-line-2)]">
        {telUrl ? (
          <a
            href={telUrl}
            className="min-h-[56px] rounded-[var(--pd-field-radius)] bg-[var(--pd-page)] border border-[var(--pd-line)] hover:border-[var(--pd-blue)] flex items-center justify-center gap-2 text-[16px] font-extrabold text-[var(--pd-navy)] active:scale-98 transition-transform"
          >
            <Phone className="w-5 h-5 text-[var(--pd-blue)]" />
            <span>{PackagesStrings.callAction}</span>
          </a>
        ) : (
          <div className="min-h-[56px] rounded-[var(--pd-field-radius)] bg-[var(--pd-page)] border border-[var(--pd-line)] flex items-center justify-center text-[16px] font-bold text-[var(--pd-muted)]">
            <span>No phone</span>
          </div>
        )}

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[56px] rounded-[var(--pd-field-radius)] bg-[#F0FDF4] border border-[#86EFAC] hover:border-[#15803D] flex items-center justify-center gap-2 text-[16px] font-extrabold text-[#15803D] active:scale-98 transition-transform"
          >
            <MessageSquare className="w-5 h-5 text-[#15803D]" />
            <span>{PackagesStrings.whatsappAction}</span>
          </a>
        ) : (
          <div className="min-h-[56px] rounded-[var(--pd-field-radius)] bg-[var(--pd-page)] border border-[var(--pd-line)] flex items-center justify-center text-[16px] font-bold text-[var(--pd-muted)]">
            <span>No WhatsApp</span>
          </div>
        )}
      </div>

      {/* Chip row: Status, Payment, Age */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {/* Status chip */}
        <span className="px-2.5 py-1 rounded-full text-[13px] font-extrabold bg-[var(--pd-tint)] text-[var(--pd-blue)] border border-[var(--pd-tint-2)]">
          {pkg.status}
        </span>

        {/* Payment chip */}
        {paymentSummary.isFullyPaid ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-extrabold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{PackagesStrings.paymentPaid}</span>
          </span>
        ) : paymentSummary.amountDueMinor === 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-extrabold bg-[var(--pd-page)] text-[var(--pd-muted)] border border-[var(--pd-line)]">
            <Minus className="w-3.5 h-3.5" />
            <span>{PackagesStrings.paymentNothingToPay}</span>
          </span>
        ) : paymentSummary.paidMinor > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
            <span>₦</span>
            <span>{PackagesStrings.paymentPartPaid}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">
            <span>₦</span>
            <span>{PackagesStrings.paymentUnpaid}</span>
          </span>
        )}

        {/* Age chip */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] border tabular-nums ${
            ageBand === 'SEVEN_PLUS'
              ? 'bg-[#FEF2F2] text-[var(--pd-bad)] border-[#FCA5A5] font-extrabold'
              : ageBand === 'THREE_TO_SIX'
              ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A] font-extrabold'
              : 'bg-[var(--pd-page)] text-[var(--pd-muted)] border-[var(--pd-line)] font-bold'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{ageDisplay}</span>
        </span>
      </div>
    </div>
  );
}
