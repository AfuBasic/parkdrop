import * as React from 'react';
import { Button } from '@/design-system';
import { AuthCodeField } from '@/features/auth/components/AuthCodeField';
import { AlertCircle } from 'lucide-react';
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (countdown / 30) * circumference;

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary mb-1">
          Enter the code
        </h1>
        <p className="text-sm font-medium text-text-secondary m-0">
          Sent to <span className="font-semibold text-text-primary">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <AuthCodeField
          ref={inputRef}
          value={code}
          onChange={handleChange}
          disabled={isLoading}
          error={!!error}
        />

        {error && (
          <p className="flex items-start gap-2 mt-2.5 text-sm leading-snug font-semibold text-status-danger animate-in shake" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-none" strokeWidth={2.5} />
            <span>{error}</span>
          </p>
        )}

        <div className="flex items-center gap-3 p-3 mt-4 rounded-xl bg-[var(--color-proto-page)]">
          <svg className="w-9 h-9 -rotate-90 flex-none" viewBox="0 0 44 44">
            <circle 
              cx="22" 
              cy="22" 
              r="20" 
              className="fill-none stroke-[var(--color-proto-line2)] stroke-[4px]" 
            />
            <circle 
              cx="22" 
              cy="22" 
              r="20" 
              className="fill-none stroke-[var(--color-proto-blue)] stroke-[4px] transition-[stroke-dashoffset] duration-1000 ease-linear" 
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: dashoffset
              }}
            />
          </svg>
          <div className="flex-1 min-w-0">
            {countdown > 0 ? (
              <p className="m-0 text-xs text-[var(--color-proto-muted)] font-medium">
                Resend code in <b className="text-[var(--color-proto-ink)] font-bold tabular-nums">{formatTime(countdown)}</b>
              </p>
            ) : (
              <p className="m-0 text-xs text-[var(--color-proto-muted)] font-medium">
                Didn't get the code?
              </p>
            )}
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || isLoading}
              className={cn(
                "inline-block p-0 bg-transparent border-0 font-inherit text-xs font-bold text-[var(--color-proto-blue-d)] underline underline-offset-2 cursor-pointer mt-0.5",
                (countdown > 0 || isLoading) && "text-[var(--color-proto-muted)] no-underline opacity-50 cursor-default"
              )}
            >
              Resend it now
            </button>
          </div>
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-3 items-center">
          <Button
            type="submit"
            size="lg"
            disabled={code.length < 6 || isLoading}
            loading={isLoading}
            className="w-full h-12 text-base font-bold"
          >
            Continue
          </Button>
          
          <p className="text-center text-xs font-medium text-text-muted">
            Need to use a different email?{' '}
            <button 
              type="button" 
              onClick={onChangeEmail}
              className="text-[var(--color-proto-blue-d)] font-bold underline underline-offset-2 bg-transparent border-0 cursor-pointer"
            >
              Go back
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
