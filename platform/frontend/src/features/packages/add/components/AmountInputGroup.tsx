import * as React from 'react';
import { cn } from '@/lib/utils';
import { AddPackageStrings } from '../strings';

export interface AmountInputGroupProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled?: boolean;
  onSubmitRequested?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

/**
 * Format string digits with thousands separator: e.g. "3500" -> "3,500"
 */
function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

/**
 * Amount to pay input group with ₦ prefix, tabular digits, thousands separators,
 * and clear explanation helper.
 */
export function AmountInputGroup({
  value,
  onChange,
  error,
  disabled,
  onSubmitRequested,
  inputRef,
  className,
}: AmountInputGroupProps) {
  const reactId = React.useId();
  const fieldId = `amount-${reactId}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const internalRef = React.useRef<HTMLInputElement>(null);
  const ref = inputRef ?? internalRef;

  const display = formatThousands(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numbers up to 7 digits
    const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 7);
    onChange(cleanDigits);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmitRequested?.();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={fieldId}
        className="block mb-2 text-[var(--pd-size-helper)] font-bold text-[var(--pd-navy)]"
      >
        {AddPackageStrings.amountLabel}
      </label>

      <div
        className={cn(
          'flex items-center w-full min-h-[var(--pd-field-h)] rounded-[var(--pd-field-radius)] bg-white',
          'border-2 transition-[border-color,box-shadow] duration-[var(--pd-motion-fast)]',
          'focus-within:border-[var(--pd-blue)] focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.16)]',
          error ? 'border-[var(--pd-bad)] bg-[var(--pd-bad-bg)]' : 'border-[var(--pd-line)]'
        )}
      >
        <span className="pl-4 pr-1 text-[24px] font-extrabold text-[var(--pd-muted)] flex-none select-none">
          ₦
        </span>

        <input
          ref={ref}
          id={fieldId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="0"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hintId}
          className={cn(
            'w-full min-w-0 bg-transparent py-3 pr-4',
            'pd-nums text-[clamp(22px,6vw,26px)] font-[var(--pd-weight-field)] text-[var(--pd-navy)]',
            'placeholder:text-[#94A3B8] placeholder:font-semibold',
            'focus:outline-none'
          )}
        />
      </div>

      {!error && (
        <p id={hintId} className="mt-2 text-[14px] font-semibold text-[var(--pd-muted)]">
          {AddPackageStrings.amountHelper}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-[14px] font-bold text-[var(--pd-bad)]">
          {error}
        </p>
      )}
    </div>
  );
}
