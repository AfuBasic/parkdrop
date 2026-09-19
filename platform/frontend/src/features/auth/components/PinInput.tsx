import * as React from 'react';
import { cn } from '@/lib/utils';

interface PinInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  secure?: boolean;
}

export function PinInput({
  length,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  disabled = false,
  error = false,
  secure = false,
}: PinInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>(
    Array(length).fill(null)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const inputValue = e.target.value;
    // Only allow numbers
    if (!/^\d*$/.test(inputValue)) return;

    // Handle paste or multiple chars
    if (inputValue.length > 1) {
      const pasted = inputValue.slice(0, length);
      onChange(pasted);
      if (pasted.length === length) {
        onComplete?.(pasted);
        inputRefs.current[length - 1]?.focus();
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
      return;
    }

    const newValue = value.split('');
    newValue[index] = inputValue;
    const finalValue = newValue.join('');
    
    onChange(finalValue);

    if (inputValue !== '') {
      // Move to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (finalValue.length === length) {
        onComplete?.(finalValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Focus previous on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  React.useEffect(() => {
    if (autoFocus && !disabled) {
      // Focus the first empty input, or the first one if all full (or just always 0 to be safe)
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type={secure ? 'password' : 'text'}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length} // Allow pasting full string
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className={cn(
            "w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold rounded-xl border bg-surface-default text-text-primary",
            "focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-all",
            error ? "border-status-danger text-status-danger focus:ring-status-danger" : "border-border-strong",
            disabled ? "opacity-50 cursor-not-allowed bg-surface-disabled" : ""
          )}
        />
      ))}
    </div>
  );
}
