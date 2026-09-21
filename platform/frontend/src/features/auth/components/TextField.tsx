import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notice } from './Notice';

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Always rendered and always visible — never a placeholder standing in. */
  label: string;
  /** Helper sentence under the field. */
  hint?: string;
  error?: string;
  /** Show an X that empties the field. */
  clearable?: boolean;
  onClear?: () => void;
  /** Counter shown at the right of the label row, e.g. "31 / 60". */
  counter?: string;
  counterOver?: boolean;
}

/**
 * A 68px text field with a real, permanently visible label.
 *
 * The label is a genuine <label for>, not a placeholder: placeholders vanish
 * the moment someone starts typing, which leaves them with no way to check
 * what the field was for, and they are invisible to autofill and to TalkBack.
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      hint,
      error,
      clearable,
      onClear,
      counter,
      counterOver,
      id,
      className,
      value,
      ...props
    },
    ref
  ) => {
    const reactId = React.useId();
    const fieldId = id ?? `field-${reactId}`;
    const hintId = `${fieldId}-hint`;
    const errorId = `${fieldId}-error`;

    const hasValue = value !== undefined && String(value).length > 0;
    const describedBy = [hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="w-full">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <label
            htmlFor={fieldId}
            className="text-[var(--pd-size-helper)] font-bold text-[var(--pd-navy)]"
          >
            {label}
          </label>
          {counter && (
            <span
              className={cn(
                'pd-nums text-[var(--pd-size-min)] font-bold flex-none',
                counterOver ? 'text-[var(--pd-bad)]' : 'text-[var(--pd-muted)]'
              )}
            >
              {counter}
            </span>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            ref={ref}
            id={fieldId}
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            className={cn(
              'w-full h-[var(--pd-field-h)] rounded-[var(--pd-field-radius)] bg-white',
              'border-2 px-4',
              'text-[19px] font-[var(--pd-weight-field)] text-[var(--pd-navy)]',
              'placeholder:text-[#94A3B8] placeholder:font-semibold',
              'transition-[border-color,box-shadow] duration-[var(--pd-motion-fast)]',
              'focus:outline-none focus:border-[var(--pd-blue)] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.16)]',
              error
                ? 'border-[var(--pd-bad)] bg-[var(--pd-bad-bg)]'
                : 'border-[var(--pd-line)]',
              clearable && hasValue && 'pr-[60px]',
              className
            )}
            {...props}
          />

          {clearable && hasValue && (
            <button
              type="button"
              onClick={onClear}
              aria-label={`Clear ${label.toLowerCase()}`}
              className={cn(
                'absolute right-2.5 grid place-items-center',
                // Visually 44px, but padded out to a 48px touch area.
                'w-11 h-11 rounded-full',
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

        {hint && !error && (
          <p
            id={hintId}
            className="mt-2 m-0 text-[var(--pd-size-min)] font-semibold text-[var(--pd-muted)] leading-[1.4]"
          >
            {hint}
          </p>
        )}

        {error && (
          <Notice tone="error" plain shake className="mt-2.5" >
            <span id={errorId}>{error}</span>
          </Notice>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
