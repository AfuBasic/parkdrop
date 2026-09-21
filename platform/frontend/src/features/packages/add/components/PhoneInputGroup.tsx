import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNationalDisplay, toNationalDigits, NATIONAL_LENGTH } from '@/features/auth/lib/phone';
import { AddPackageStrings } from '../strings';

export interface PhoneInputGroupProps {
  value: string;
  onChange: (digits: string) => void;
  onClear: () => void;
  error?: string;
  disabled?: boolean;
  onSubmitRequested?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}

const NIGERIA_FLAG = (
  <svg viewBox="0 0 24 16" className="w-6 h-4 rounded-[3px] flex-none" aria-hidden="true" focusable="false">
    <rect width="24" height="16" fill="#fff" />
    <rect width="8" height="16" fill="#008751" />
    <rect x="16" width="8" height="16" fill="#008751" />
  </svg>
);

/**
 * 68px PhoneField with Flag, +234, 24-26px numbers, clear button, and numeric inputMode.
 */
export function PhoneInputGroup({
  value,
  onChange,
  onClear,
  error,
  disabled,
  onSubmitRequested,
  inputRef,
  className,
}: PhoneInputGroupProps) {
  const reactId = React.useId();
  const fieldId = `phone-${reactId}`;
  const errorId = `${fieldId}-error`;
  const internalRef = React.useRef<HTMLInputElement>(null);
  const ref = inputRef ?? internalRef;

  const display = formatNationalDisplay(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(toNationalDigits(e.target.value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmitRequested?.();
    }
  };

  const hasValue = display.length > 0;

  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={fieldId}
        className="block mb-2 text-[var(--pd-size-helper)] font-bold text-[var(--pd-navy)]"
      >
        {AddPackageStrings.phoneLabel}
      </label>

      <div
        className={cn(
          'flex items-center w-full min-h-[var(--pd-field-h)] rounded-[var(--pd-field-radius)] bg-white',
          'border-2 transition-[border-color,box-shadow] duration-[var(--pd-motion-fast)]',
          'focus-within:border-[var(--pd-blue)] focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.16)]',
          error ? 'border-[var(--pd-bad)] bg-[var(--pd-bad-bg)]' : 'border-[var(--pd-line)]'
        )}
      >
        <span
          className={cn(
            'flex items-center gap-2 flex-none self-stretch pl-3.5 pr-3 my-2 mr-1',
            'border-r-2 border-[var(--pd-line-2)]'
          )}
        >
          {NIGERIA_FLAG}
          <span className="pd-nums text-[19px] font-extrabold text-[var(--pd-navy)]">
            +234
          </span>
        </span>

        <input
          ref={ref}
          id={fieldId}
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          maxLength={NATIONAL_LENGTH + 3}
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={AddPackageStrings.phonePlaceholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full min-w-0 bg-transparent py-3 pr-2',
            'pd-nums text-[clamp(22px,6vw,26px)] font-[var(--pd-weight-field)] text-[var(--pd-navy)]',
            'placeholder:text-[#94A3B8] placeholder:font-semibold',
            'focus:outline-none'
          )}
        />

        {hasValue && (
          <button
            type="button"
            onClick={onClear}
            aria-label={AddPackageStrings.phoneClear}
            className={cn(
              'grid place-items-center flex-none mr-2.5',
              'w-11 h-11 rounded-full',
              'bg-[var(--pd-tint)] text-[var(--pd-blue-hover)]',
              'hover:bg-[var(--pd-tint-2)] active:scale-95 transition-transform',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pd-blue)]'
            )}
          >
            <X className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-[14px] font-bold text-[var(--pd-bad)]">
          {error}
        </p>
      )}
    </div>
  );
}
