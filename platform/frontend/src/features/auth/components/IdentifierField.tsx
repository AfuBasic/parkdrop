import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notice } from './Notice';
import { AuthStrings } from '../strings';
import type { IdentifierMode } from '../config';
import { formatNationalDisplay, toNationalDigits, NATIONAL_LENGTH } from '../lib/phone';

export interface IdentifierFieldProps {
  mode: IdentifierMode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  onSubmitRequested?: () => void;
  /** Quick domain chips, email mode only. */
  domainChips?: string[];
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const NIGERIA_FLAG = (
  // Drawn rather than an emoji: flag emoji do not render on many low-cost
  // Android builds and fall back to the letters "NG" in a box.
  <svg viewBox="0 0 24 16" className="w-6 h-4 rounded-[3px]" aria-hidden="true" focusable="false">
    <rect width="24" height="16" fill="#fff" />
    <rect width="8" height="16" fill="#008751" />
    <rect x="16" width="8" height="16" fill="#008751" />
  </svg>
);

/**
 * The one field on screen 1, in whichever shape the flow is configured for.
 *
 * Phone mode gives a numeric keypad, a fixed +234 chip (so nobody has to know
 * their own country code) and re-formats as you type. Email mode gives the
 * email keyboard and domain chips that append to whatever has been typed, for
 * people who know their address but find "@" awkward to find on a phone
 * keyboard.
 */
export function IdentifierField({
  mode,
  value,
  onChange,
  error,
  disabled,
  onSubmitRequested,
  domainChips = ['@gmail.com', '@yahoo.com'],
  inputRef,
}: IdentifierFieldProps) {
  const reactId = React.useId();
  const fieldId = `identifier-${reactId}`;
  const errorId = `${fieldId}-error`;
  const internalRef = React.useRef<HTMLInputElement>(null);
  const ref = inputRef ?? internalRef;

  const isPhone = mode === 'phone';
  const display = isPhone ? formatNationalDisplay(value) : value;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (!isPhone) {
      onChange(next);
      return;
    }

    // Store the raw digits; the display format is derived, so a paste of
    // "+234 803-123-4567" and a typed "08031234567" end up identical.
    onChange(toNationalDigits(next));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmitRequested?.();
    }
  };

  const appendDomain = (domain: string) => {
    const local = value.split('@')[0] ?? '';
    onChange(local + domain);
    ref.current?.focus();
  };

  const clear = () => {
    onChange('');
    ref.current?.focus();
  };

  const hasValue = display.length > 0;

  return (
    <div className="w-full">
      <label
        htmlFor={fieldId}
        className="block mb-2 text-[var(--pd-size-helper)] font-bold text-[var(--pd-navy)]"
      >
        {AuthStrings.identifierLabel(mode)}
      </label>

      <div
        className={cn(
          'flex items-center w-full min-h-[var(--pd-field-h)] rounded-[var(--pd-field-radius)] bg-white',
          'border-2 transition-[border-color,box-shadow] duration-[var(--pd-motion-fast)]',
          'focus-within:border-[var(--pd-blue)] focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.16)]',
          error ? 'border-[var(--pd-bad)] bg-[var(--pd-bad-bg)]' : 'border-[var(--pd-line)]'
        )}
      >
        {isPhone && (
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
        )}

        <input
          ref={ref}
          id={fieldId}
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder={AuthStrings.identifierPlaceholder(mode)}
          {...(isPhone
            ? {
                type: 'tel' as const,
                inputMode: 'numeric' as const,
                autoComplete: 'tel-national',
                // 10 digits + two grouping spaces + the leading trunk zero.
                maxLength: NATIONAL_LENGTH + 3,
              }
            : {
                type: 'email' as const,
                inputMode: 'email' as const,
                autoComplete: 'email',
                autoCapitalize: 'none' as const,
                autoCorrect: 'off' as const,
                spellCheck: false,
              })}
          className={cn(
            'flex-1 min-w-0 bg-transparent border-0 outline-none',
            'h-[var(--pd-field-h)] px-3',
            'font-[var(--pd-weight-field)] text-[var(--pd-navy)]',
            'placeholder:text-[#94A3B8] placeholder:font-semibold',
            // Phone numbers get the bigger tabular treatment; email addresses
            // are longer and need to fit, so they sit a size down.
            isPhone ? 'pd-nums text-[24px] tracking-[0.01em]' : 'text-[19px]',
            isPhone && 'pl-1'
          )}
        />

        {hasValue && !disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label={AuthStrings.identifierClear}
            className={cn(
              'flex-none grid place-items-center mr-2.5 w-11 h-11 rounded-full',
              'bg-[var(--pd-tint)] text-[var(--pd-blue-hover)]',
              'hover:bg-[var(--pd-tint-2)] active:scale-95',
              'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
            )}
          >
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
        )}
      </div>

      {!isPhone && domainChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {domainChips.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => appendDomain(domain)}
              className={cn(
                'min-h-[var(--pd-tap-min)] px-4 rounded-xl',
                'border-2 border-[var(--pd-tint-2)] bg-[var(--pd-tint)]',
                'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-blue-hover)]',
                'hover:bg-[var(--pd-tint-2)] active:scale-[0.97]',
                'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
              )}
            >
              {domain}
            </button>
          ))}
        </div>
      )}

      {error && (
        <Notice tone="error" plain shake className="mt-3">
          <span id={errorId}>{error}</span>
        </Notice>
      )}
    </div>
  );
}
