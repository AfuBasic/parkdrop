import * as React from 'react';
import { formatMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export type SmsCreditInputMode = 'credits' | 'amount';

export interface SmsCreditQuantityInputProps {
  pricePerCreditMinor: number;
  minCredits: number;
  maxCredits: number;
  credits: number;
  onChangeCredits: (credits: number) => void;
  disabled?: boolean;
}

/**
 * Lets the owner type either "how many SMS" or "how much money", and keeps
 * the other one in sync from the flat per-credit price. Credits is always
 * the value of record (what gets sent to the server) — the amount field is
 * just a different way to edit it, rounded down to a whole credit so the
 * two never show numbers that don't actually match each other.
 */
export function SmsCreditQuantityInput({
  pricePerCreditMinor,
  minCredits,
  maxCredits,
  credits,
  onChangeCredits,
  disabled = false,
}: SmsCreditQuantityInputProps) {
  const [mode, setMode] = React.useState<SmsCreditInputMode>('credits');
  const [creditsText, setCreditsText] = React.useState(String(credits));
  const [amountText, setAmountText] = React.useState(String((credits * pricePerCreditMinor) / 100));

  // Re-sync the inactive field's text whenever credits changes from outside
  // (mode switch, or the parent adjusting an out-of-range value).
  React.useEffect(() => {
    if (mode === 'credits') {
      setAmountText(String((credits * pricePerCreditMinor) / 100));
    } else {
      setCreditsText(String(credits));
    }
  }, [credits, pricePerCreditMinor, mode]);

  const handleCreditsChange = (text: string) => {
    setCreditsText(text);
    const parsed = parseInt(text, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      onChangeCredits(parsed);
    }
  };

  const handleAmountChange = (text: string) => {
    setAmountText(text);
    const parsedNaira = parseFloat(text);
    if (Number.isFinite(parsedNaira) && parsedNaira >= 0) {
      const impliedCredits = Math.floor((parsedNaira * 100) / pricePerCreditMinor);
      onChangeCredits(impliedCredits);
    }
  };

  const outOfRange = credits > 0 && (credits < minCredits || credits > maxCredits);

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex self-start rounded-[var(--pd-chip-radius)] bg-[var(--pd-tint)] p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'credits'}
          disabled={disabled}
          onClick={() => setMode('credits')}
          className={cn(
            'min-h-[40px] px-4 rounded-[calc(var(--pd-chip-radius)-2px)] text-[15px] font-bold transition-colors cursor-pointer',
            mode === 'credits' ? 'bg-white text-[var(--pd-navy)] shadow-xs' : 'text-[var(--pd-muted)]'
          )}
        >
          Number of SMS
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'amount'}
          disabled={disabled}
          onClick={() => setMode('amount')}
          className={cn(
            'min-h-[40px] px-4 rounded-[calc(var(--pd-chip-radius)-2px)] text-[15px] font-bold transition-colors cursor-pointer',
            mode === 'amount' ? 'bg-white text-[var(--pd-navy)] shadow-xs' : 'text-[var(--pd-muted)]'
          )}
        >
          Amount to pay
        </button>
      </div>

      {mode === 'credits' ? (
        <div className="flex items-center gap-3 rounded-[var(--pd-card-radius)] border-2 border-[var(--pd-line-2)] bg-white px-4 py-3 focus-within:border-[var(--pd-blue)]">
          <input
            type="number"
            inputMode="numeric"
            value={creditsText}
            disabled={disabled}
            onChange={(e) => handleCreditsChange(e.target.value)}
            className="flex-1 min-w-0 text-[28px] font-extrabold text-[var(--pd-navy)] outline-none tabular-nums"
            aria-label="Number of SMS credits"
          />
          <span className="text-[18px] font-bold text-[var(--pd-muted)] shrink-0">SMS</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-[var(--pd-card-radius)] border-2 border-[var(--pd-line-2)] bg-white px-4 py-3 focus-within:border-[var(--pd-blue)]">
          <span className="text-[28px] font-extrabold text-[var(--pd-navy)] shrink-0">₦</span>
          <input
            type="number"
            inputMode="decimal"
            value={amountText}
            disabled={disabled}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="flex-1 min-w-0 text-[28px] font-extrabold text-[var(--pd-navy)] outline-none tabular-nums"
            aria-label="Amount to pay in naira"
          />
        </div>
      )}

      <p className="m-0 text-[15px] font-semibold text-[var(--pd-muted)]">
        {mode === 'credits'
          ? `${formatMoney(credits * pricePerCreditMinor)} at ₦${pricePerCreditMinor / 100} per SMS`
          : `${credits} SMS at ₦${pricePerCreditMinor / 100} per SMS`}
      </p>

      {outOfRange && (
        <p className="m-0 text-[15px] font-bold text-[var(--pd-bad)]">
          {credits < minCredits
            ? `Buy at least ${minCredits} SMS credits.`
            : `You can buy at most ${maxCredits} SMS credits at once.`}
        </p>
      )}
    </div>
  );
}
