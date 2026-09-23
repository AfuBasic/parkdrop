import { Check } from 'lucide-react';
import type { SmsCreditBundle } from '@/features/sms-credits/purchase/types';
import { formatMoney } from '@/lib/formatters';

interface SmsCreditBundleOptionProps {
  bundle: SmsCreditBundle;
  selected: boolean;
  disabled?: boolean;
  onSelect: (bundle: SmsCreditBundle) => void;
  /** The plain third line, e.g. "Enough for about 200 packages" (design plan §3.3.30). */
  enoughForLabel: string;
}

/** A bundle card, 96px tall: the SMS count, the price, and what it covers. */
export function SmsCreditBundleOption({
  bundle,
  selected,
  disabled = false,
  onSelect,
  enoughForLabel,
}: SmsCreditBundleOptionProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onSelect(bundle);
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          onSelect(bundle);
        }
      }}
      className={`
        w-full min-h-[96px] p-4 rounded-[var(--pd-card-radius)] border-2 transition-all cursor-pointer
        flex items-center justify-between select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'}
        ${
          selected
            ? 'bg-[var(--pd-tint)] border-[var(--pd-blue)]'
            : 'bg-white border-[var(--pd-line-2)]'
        }
      `}
    >
      <div className="text-left">
        <div className="text-[30px] font-extrabold text-[var(--pd-navy)] leading-none">
          {bundle.credits} SMS
        </div>
        <div className="text-[22px] font-bold text-[var(--pd-navy)] mt-1.5">
          {formatMoney(bundle.amount_minor)}
        </div>
        <div className="text-[15px] font-semibold text-[var(--pd-muted)] mt-1">
          {enoughForLabel}
        </div>
      </div>

      <div
        className={`
          w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0
          ${selected ? 'border-[var(--pd-blue)] bg-[var(--pd-blue)]' : 'border-[var(--pd-line)] bg-white'}
        `}
        aria-hidden="true"
      >
        {selected && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
      </div>
    </div>
  );
}
