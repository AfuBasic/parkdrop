import type { ReactNode } from 'react';
import { Check, Clock, CircleDollarSign, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMoney, formatPhone } from '@/lib/formatters';
import type { PaymentState } from '@/features/payments/domain/payment-summary';
import { HomeStrings } from '../strings';
import type { AgeTone } from '../lib/packageAge';
import type { HomePackageRow } from '../hooks/useHomeData';

/** The 6px edge, and the age chip, share one colour per tone. */
const AGE_EDGE: Record<AgeTone, string> = {
  normal: 'bg-[var(--pd-line)]',
  warn: 'bg-[#D97706]',
  bad: 'bg-[var(--pd-bad)]',
};

const AGE_CHIP: Record<AgeTone, string> = {
  normal: 'bg-[#F1F5F9] text-[var(--pd-muted)]',
  warn: 'bg-[var(--pd-warn-bg)] text-[var(--pd-warn)]',
  bad: 'bg-[var(--pd-bad-bg)] text-[var(--pd-bad)]',
};

const PAY_CHIP: Record<PaymentState, string> = {
  UNPAID: 'bg-[var(--pd-warn-bg)] text-[var(--pd-warn)]',
  PART_PAID: 'bg-[var(--pd-tint)] text-[var(--pd-blue-dark)]',
  PAID: 'bg-[var(--pd-ok-bg)] text-[var(--pd-ok)]',
};

const PAY_LABEL: Record<PaymentState, string> = {
  UNPAID: HomeStrings.payUnpaid,
  PART_PAID: HomeStrings.payPart,
  PAID: HomeStrings.payPaid,
};

function PayIcon({ state }: { state: PaymentState }) {
  const props = { className: 'w-[15px] h-[15px] flex-none', strokeWidth: 2.75 } as const;
  if (state === 'PAID') return <Check {...props} aria-hidden="true" />;
  if (state === 'PART_PAID') return <CircleDot {...props} aria-hidden="true" />;
  return <CircleDollarSign {...props} aria-hidden="true" />;
}

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 flex-none',
        'rounded-[var(--pd-chip-radius)] px-2.5 py-1',
        'text-[var(--pd-size-small)] font-bold leading-none whitespace-nowrap',
        className
      )}
    >
      {children}
    </span>
  );
}

export interface ParcelRowProps {
  row: HomePackageRow;
  onSelect: (packageId: string) => void;
}

/**
 * One waiting package, shaped like the label on the parcel itself.
 *
 * The whole row is a single button. Nothing inside it is separately
 * tappable, so there is no way to hit the wrong target with a thumb, and a
 * screen reader announces one control with the whole story in its name.
 *
 * Status is never carried by colour alone: the 6px edge is backed by the
 * age chip's own words, and the payment chip pairs an icon with a word, so
 * the row still works on a washed-out screen in the sun.
 */
export function ParcelRow({ row, onSelect }: ParcelRowProps) {
  const owes = row.balanceMinor > 0;
  const money = formatMoney(owes ? row.balanceMinor : row.amountDueMinor);
  const phone = row.customerPhone ? formatPhone(row.customerPhone) : row.pickupCode;

  return (
    <button
      type="button"
      onClick={() => onSelect(row.id)}
      aria-label={`${row.customerName}. ${money} ${PAY_LABEL[row.paymentState]}. ${row.age.label}. ${HomeStrings.rowHint(row.customerName)}`}
      className={cn(
        'relative w-full min-h-[var(--pd-row-h)] overflow-hidden text-left',
        'flex items-center gap-3 pl-5 pr-4 py-3',
        'rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] bg-white',
        'transition-[background-color,transform] duration-[var(--pd-motion-fast)]',
        'hover:bg-[var(--pd-tint)] active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
      )}
    >
      <span
        aria-hidden="true"
        className={cn('absolute left-0 top-0 bottom-0 w-[6px]', AGE_EDGE[row.age.tone])}
      />

      <span className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[var(--pd-size-row-name)] font-extrabold leading-tight tracking-[-0.01em] text-[var(--pd-navy)] truncate">
            {row.customerName}
          </span>
          <span
            className={cn(
              'flex-none text-[var(--pd-size-row-name)] font-extrabold leading-tight tabular-nums',
              owes ? 'text-[var(--pd-navy)]' : 'text-[var(--pd-muted)]'
            )}
          >
            {money}
          </span>
        </span>

        <span className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[var(--pd-size-meta)] font-semibold leading-none text-[var(--pd-muted)] tabular-nums truncate">
            {phone}
          </span>

          <span className="flex items-center gap-1.5 flex-none">
            <Chip className={PAY_CHIP[row.paymentState]}>
              <PayIcon state={row.paymentState} />
              {PAY_LABEL[row.paymentState]}
            </Chip>

            <Chip className={AGE_CHIP[row.age.tone]}>
              <Clock className="w-[15px] h-[15px] flex-none" strokeWidth={2.75} aria-hidden="true" />
              {row.age.label}
            </Chip>
          </span>
        </span>
      </span>
    </button>
  );
}
