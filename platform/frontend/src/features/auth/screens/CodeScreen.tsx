import * as React from 'react';
import { AuthStrings } from '../strings';
import { Button } from '@/design-system';
import { cn } from '@/lib/utils';

interface CodeScreenProps {
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onProblemLoggingIn?: () => void;
  isLoading?: boolean;
  error?: string;
  onChangeEmail?: () => void;
}

export function CodeScreen({ 
  email, 
  onVerify, 
  onResend, 
  onProblemLoggingIn,
  isLoading, 
  error, 
  onChangeEmail 
}: CodeScreenProps) {
  const [code, setCode] = React.useState('');
  const [countdown, setCountdown] = React.useState(30);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers, max 6 characters
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);

    // Auto-submit when exactly 6 digits entered
    if (val.length === 6) {
      onVerify(val);
    }
  };

  const handleResend = () => {
    if (countdown === 0 && !isLoading) {
      setCountdown(30);
      setCode('');
      inputRef.current?.focus();
      onResend();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6 && !isLoading) {
      onVerify(code);
    }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="mb-6 md:mb-8 text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-text-primary">
          {AuthStrings.codeTitle}
        </h1>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-text-secondary text-sm sm:text-base">
            {AuthStrings.codeSubtitle(email)}
          </p>
          {onChangeEmail && (
            <button
              type="button"
              onClick={onChangeEmail}
              className="text-xs sm:text-sm font-medium text-action-primary hover:text-action-primary-hover hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary rounded cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div>
          <label 
            htmlFor="otp-input" 
            className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 text-left"
          >
            6-Digit Code
          </label>
          
          <input
            ref={inputRef}
            id="otp-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            maxLength={6}
            value={code}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="······"
            className={cn(
              "w-full h-14 rounded-xl border bg-surface-default px-4 text-center font-mono text-2xl sm:text-3xl tracking-[0.5em] sm:tracking-[0.75em] text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all select-all",
              error
                ? "border-status-danger focus-visible:ring-status-danger"
                : "border-border-strong focus-visible:ring-border-focus"
            )}
          />

          {error ? (
            <p className="text-xs sm:text-sm text-status-danger font-medium mt-1">
              {error}
            </p>
          ) : (
            <p className="text-xs text-text-muted mt-1">
              Verification codes expire in 15 minutes.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={countdown > 0 || isLoading}
            onClick={handleResend}
            className="text-xs sm:text-sm font-medium text-action-primary hover:text-action-primary-hover hover:bg-surface-subtle px-2 h-8"
          >
            {countdown > 0 ? AuthStrings.resendCountdown(countdown) : AuthStrings.resendCode}
          </Button>
        </div>

        <div className="mt-auto pt-8 flex flex-col gap-4 items-center">
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            size="lg"
            disabled={code.length < 6 || isLoading}
            loading={isLoading}
          >
            {AuthStrings.continue}
          </Button>

          {onProblemLoggingIn ? (
            <button
              type="button"
              onClick={onProblemLoggingIn}
              className="text-xs sm:text-sm text-text-muted hover:text-action-primary transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary rounded cursor-pointer"
            >
              {AuthStrings.problemLoggingIn}
            </button>
          ) : (
            <a
              href="mailto:support@parkdrop.com.ng?subject=ParkDrop%20Verification%20Code%20Help"
              className="text-xs sm:text-sm text-text-muted hover:text-action-primary transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary rounded"
            >
              {AuthStrings.problemLoggingIn}
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
