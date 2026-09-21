import * as React from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthStrings } from '../strings';

export interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  /** Announced to screen readers, e.g. "Choose a PIN". */
  label: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'delete'] as const;

/**
 * Four dots plus our own number keypad.
 *
 * We draw the keypad rather than opening the system keyboard for two reasons:
 * on a small phone the system keyboard covers most of the screen including the
 * dots the user is trying to watch fill, and its keys are laid out for text,
 * not digits. Our keys are 64px and always in the same place.
 *
 * There is no Continue button — the PIN advances on the fourth digit, because
 * a 4-digit PIN has exactly one moment it can be finished and asking for a
 * second tap to confirm it adds nothing.
 *
 * A hardware keyboard still works, for desktop and for anyone on a phone with
 * a physical keyboard.
 */
export function PinPad({
  value,
  onChange,
  onComplete,
  length = 4,
  error,
  disabled,
  label,
}: PinPadProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const press = React.useCallback(
    (digit: string) => {
      if (disabled || value.length >= length) return;
      const next = value + digit;
      onChange(next);
      if (next.length === length) onComplete?.(next);
    },
    [disabled, value, length, onChange, onComplete]
  );

  const backspace = React.useCallback(() => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  }, [disabled, value, onChange]);

  // Hardware keyboard support. Bound to the document so the user does not have
  // to find and focus a particular key first.
  React.useEffect(() => {
    if (disabled) return;

    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        press(event.key);
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        backspace();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [press, backspace, disabled]);

  return (
    <div className="w-full flex flex-col items-center gap-7">
      {/* Dots */}
      <div
        ref={containerRef}
        className={cn('flex gap-4', error && 'pd-shake')}
        role="status"
        aria-live="polite"
        aria-label={`${label}. ${value.length} of ${length} numbers entered.`}
      >
        {Array.from({ length }).map((_, index) => {
          const filled = index < value.length;
          return (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                'w-[22px] h-[22px] rounded-full border-[3px]',
                'transition-[background-color,border-color,transform] duration-[var(--pd-motion-fast)]',
                error
                  ? 'border-[var(--pd-bad)] bg-[var(--pd-bad)]'
                  : filled
                    ? 'border-[var(--pd-blue)] bg-[var(--pd-blue)] scale-110'
                    : 'border-[var(--pd-line)] bg-transparent'
              )}
            />
          );
        })}
      </div>

      {/* Keypad */}
      <div
        className="grid grid-cols-3 gap-2.5 w-full max-w-[320px]"
        role="group"
        aria-label={AuthStrings.pinPadLabel}
      >
        {KEYS.map((key, index) => {
          if (key === null) return <span key={`gap-${index}`} aria-hidden="true" />;

          if (key === 'delete') {
            return (
              <button
                key="delete"
                type="button"
                onClick={backspace}
                disabled={disabled}
                aria-label={AuthStrings.pinDelete}
                className={cn(
                  'min-h-[var(--pd-pin-key-h)] rounded-[var(--pd-field-radius)]',
                  'inline-flex items-center justify-center gap-1.5',
                  'bg-[var(--pd-tint)] text-[var(--pd-blue-hover)]',
                  'text-[var(--pd-size-min)] font-extrabold',
                  'active:scale-[0.96] active:bg-[var(--pd-tint-2)]',
                  'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
                  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30',
                  'disabled:opacity-60'
                )}
              >
                <Delete className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
                {/* Icon plus the word, so it is unambiguous. */}
                <span>{AuthStrings.pinDelete}</span>
              </button>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => press(key)}
              disabled={disabled}
              className={cn(
                'min-h-[var(--pd-pin-key-h)] rounded-[var(--pd-field-radius)]',
                'pd-nums text-[26px] font-extrabold text-[var(--pd-navy)]',
                'bg-white border-2 border-[var(--pd-line-2)]',
                'active:scale-[0.96] active:bg-[var(--pd-tint)] active:border-[var(--pd-blue)]',
                'transition-[transform,background-color,border-color] duration-[var(--pd-motion-fast)]',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30',
                'disabled:opacity-60'
              )}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
