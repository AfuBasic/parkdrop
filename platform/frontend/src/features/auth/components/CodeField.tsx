import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired the moment all six digits are present. */
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  label: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const LENGTH = 6;

/**
 * Six boxes that are really one input.
 *
 * The boxes are decoration; a single transparent <input> is stretched across
 * all of them. Six separate inputs look the same but quietly break the three
 * things that matter most here: Android's SMS autofill (it fills one box and
 * gives up), pasting a code copied from the message, and password managers.
 * One input with autocomplete="one-time-code" gets all three for free, and
 * means there is only ever one caret to reason about.
 *
 * Empty boxes are left genuinely empty. The old dots read as a password mask
 * and made people think their typing was being hidden from them.
 */
export function CodeField({
  value,
  onChange,
  onComplete,
  error,
  disabled,
  autoFocus,
  label,
  inputRef,
}: CodeFieldProps) {
  const internalRef = React.useRef<HTMLInputElement>(null);
  const ref = inputRef ?? internalRef;
  const [focused, setFocused] = React.useState(false);

  const reactId = React.useId();
  const fieldId = `code-${reactId}`;

  React.useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus();
    // Focusing once on mount is the intent; re-running on every keystroke
    // would fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.replace(/\D/g, '').slice(0, LENGTH);
    if (next === value) return;

    onChange(next);
    if (next.length === LENGTH) onComplete?.(next);
  };

  const digits = value.split('');
  const activeIndex = Math.min(value.length, LENGTH - 1);

  return (
    <div className="relative w-full">
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>

      <div
        className={cn('flex gap-2 w-full', error && 'pd-shake')}
        aria-hidden="true"
      >
        {Array.from({ length: LENGTH }).map((_, index) => {
          const filled = index < value.length;
          const isActive = focused && index === activeIndex && value.length < LENGTH;
          const showCaret = focused && index === value.length;

          return (
            <span
              key={index}
              className={cn(
                'relative flex-1 min-w-0 h-[var(--pd-code-slot-h)] grid place-items-center',
                'rounded-[var(--pd-field-radius)] border-2 bg-white',
                'pd-nums text-[28px] font-extrabold text-[var(--pd-navy)]',
                'transition-[border-color,background-color,box-shadow] duration-[var(--pd-motion-fast)]',
                error
                  ? 'border-[var(--pd-bad)] bg-[var(--pd-bad-bg)]'
                  : filled
                    ? 'border-[var(--pd-blue)] bg-[var(--pd-tint)]'
                    : isActive
                      ? 'border-[var(--pd-blue)] shadow-[0_0_0_4px_rgba(37,99,235,0.16)]'
                      : 'border-[var(--pd-line)]'
              )}
            >
              {digits[index] ?? ''}
              {showCaret && (
                <span className="pd-caret absolute w-[3px] h-7 rounded-full bg-[var(--pd-blue)]" />
              )}
            </span>
          );
        })}
      </div>

      <input
        ref={ref}
        id={fieldId}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        // Password managers try to treat this as a username field.
        data-lpignore="true"
        data-1p-ignore="true"
        data-form-type="other"
        className={cn(
          'absolute inset-0 w-full h-full z-10',
          'opacity-0 border-0 p-0 m-0 bg-transparent',
          // 16px minimum stops iOS Safari zooming the page on focus.
          'text-[16px] caret-transparent cursor-text',
          disabled && 'cursor-not-allowed'
        )}
      />
    </div>
  );
}
