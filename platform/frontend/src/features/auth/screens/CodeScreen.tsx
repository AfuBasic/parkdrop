import * as React from 'react';
import { AuthStrings } from '../strings';
import { Button } from '@/design-system';
import { AuthCodeField } from '../components/AuthCodeField';
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
      <div className="mb-8 text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-text-primary">
          {AuthStrings.codeTitle}
        </h1>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-text-secondary text-[15px] sm:text-base leading-snug">
            We sent a 6-digit code to <span className="font-medium text-text-primary block sm:inline">{email}</span>
          </p>
          {onChangeEmail && (
            <button
              type="button"
              onClick={onChangeEmail}
              className="text-[15px] sm:text-base font-semibold text-action-primary hover:text-action-primary-hover hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary rounded cursor-pointer min-h-[44px] sm:min-h-0 flex items-center"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="mb-6">
          <label 
            htmlFor="otp-input" 
            className="sr-only"
          >
            6-Digit Code
          </label>
          
          <AuthCodeField
            ref={inputRef}
            id="otp-input"
            value={code}
            onChange={handleChange}
            disabled={isLoading}
            error={!!error}
            placeholder="······"
          />

          {error ? (
            <p className="text-[13px] sm:text-sm text-status-danger-text font-medium mt-2.5">
              {error}
            </p>
          ) : (
            <p className="text-[13px] text-text-muted mt-2.5">
              This code expires in 15 minutes.
            </p>
          )}
        </div>

        <div className="flex items-center mb-8">
          {countdown > 0 ? (
            <p className="text-[14px] text-text-muted">
              Resend code in {countdown}s
            </p>
          ) : (
            <p className="text-[14px] text-text-secondary">
              Didn't get the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="font-semibold text-action-primary hover:text-action-primary-hover hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary rounded disabled:opacity-50 min-h-[44px] inline-flex items-center"
              >
                Resend code
              </button>
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-4 items-center pb-2">
          <Button
            type="submit"
            className="w-full h-[52px] sm:h-[56px] text-base font-semibold"
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
              className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded cursor-pointer min-h-[44px] flex items-center justify-center w-full"
            >
              {AuthStrings.problemLoggingIn}
            </button>
          ) : (
            <a
              href="mailto:support@parkdrop.com.ng?subject=ParkDrop%20Verification%20Code%20Help"
              className="text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded min-h-[44px] flex items-center justify-center w-full"
            >
              {AuthStrings.problemLoggingIn}
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
