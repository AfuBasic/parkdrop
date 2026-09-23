import { X, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { LocalSmsCreditPurchase } from '@/offline/db/schema';
import { formatMoney } from '@/lib/formatters';

const PROVIDER_LABEL: Record<string, string> = {
  paystack: 'Paystack',
  flutterwave: 'Flutterwave',
};

const STATUS_DISPLAY: Record<
  LocalSmsCreditPurchase['status'],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  PAID: { label: 'Paid', icon: CheckCircle2, className: 'text-[var(--pd-ok)] bg-[var(--pd-ok-bg)]' },
  PENDING: { label: 'Pending', icon: Clock, className: 'text-[var(--pd-warn)] bg-[var(--pd-warn-bg)]' },
  PROCESSING: { label: 'Processing', icon: Clock, className: 'text-[var(--pd-warn)] bg-[var(--pd-warn-bg)]' },
  FAILED: { label: 'Failed', icon: XCircle, className: 'text-[var(--pd-bad)] bg-[var(--pd-bad-bg)]' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, className: 'text-[var(--pd-muted)] bg-[var(--pd-page-2)]' },
};

interface SmsCreditPurchaseDetailSheetProps {
  purchase: LocalSmsCreditPurchase;
  onClose: () => void;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-[var(--pd-line-2)] last:border-b-0">
      <span className="text-[15px] font-semibold text-[var(--pd-muted)]">{label}</span>
      <span className={bold ? 'text-[17px] font-extrabold text-[var(--pd-navy)]' : 'text-[16px] font-bold text-[var(--pd-navy)]'}>
        {value}
      </span>
    </div>
  );
}

/** The receipt for a single SMS credit purchase — fee breakdown, provider, reference, status. */
export function SmsCreditPurchaseDetailSheet({ purchase, onClose }: SmsCreditPurchaseDetailSheetProps) {
  const status = STATUS_DISPLAY[purchase.status];
  const StatusIcon = status.icon;
  // Purchases synced before fee_minor existed won't have it set locally.
  const feeMinor = purchase.fee_minor ?? 0;
  const netAmountMinor = purchase.amount_minor - feeMinor;
  const date = new Date(purchase.created_at);
  const formattedDate = !isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : purchase.created_at;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[380px] bg-white rounded-[var(--pd-card-radius)] p-5 shadow-2xl border border-[var(--pd-line)] animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)] m-0">Purchase details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 text-[var(--pd-muted)] hover:text-[var(--pd-navy)] rounded-full hover:bg-[var(--pd-page)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[14px] font-bold mb-4 ${status.className}`}
        >
          <StatusIcon className="w-4 h-4" strokeWidth={2.5} />
          <span>{status.label}</span>
        </div>

        <div className="flex flex-col">
          <Row label="SMS credits" value={`+${purchase.credits}`} />
          <Row label="Credit cost" value={formatMoney(netAmountMinor)} />
          <Row
            label="Processing fee"
            value={feeMinor > 0 ? formatMoney(feeMinor) : 'None'}
          />
          <Row label="Total paid" value={formatMoney(purchase.amount_minor)} bold />
          <Row label="Paid with" value={PROVIDER_LABEL[purchase.provider] ?? purchase.provider} />
          <Row label="Reference" value={purchase.reference} />
          <Row label="Date" value={formattedDate} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[52px] mt-5 rounded-[var(--pd-field-radius)] bg-[var(--pd-tint)] text-[var(--pd-blue-hover)] font-extrabold text-[16px] hover:bg-[var(--pd-tint-2)] active:scale-[0.99] transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
