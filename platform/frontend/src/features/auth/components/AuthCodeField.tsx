import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AuthCodeFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const AuthCodeField = React.forwardRef<HTMLInputElement, AuthCodeFieldProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        data-lpignore="true"
        data-1p-ignore="true"
        data-form-type="other"
        maxLength={6}
        className={cn(
          "w-full h-14 sm:h-16 rounded-xl border bg-surface-default px-4 text-center font-mono text-2xl sm:text-3xl font-semibold tracking-[0.5em] sm:tracking-[0.75em] text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all select-all",
          error
            ? "border-status-danger focus-visible:ring-status-danger"
            : "border-border-strong focus-visible:ring-border-focus",
          className
        )}
        {...props}
      />
    );
  }
);
AuthCodeField.displayName = 'AuthCodeField';
