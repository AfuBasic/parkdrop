import * as React from 'react';
import { AuthStrings } from '../strings';
import { Input, Button } from '@/design-system';
import { CheckCircle2, MessageSquare, Shield, X, AlertCircle } from 'lucide-react';

interface EmailScreenProps {
  initialEmail?: string;
  onContinue: (email: string) => void;
  onProblemLoggingIn?: () => void;
  isLoading?: boolean;
}

export function EmailScreen({ initialEmail = '', onContinue, onProblemLoggingIn, isLoading }: EmailScreenProps) {
  const [email, setEmail] = React.useState(initialEmail);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Check your email. It should look like name@gmail.com.");
      return;
    }
    setError('');
    onContinue(trimmed.toLowerCase());
  };

  const handleClear = () => {
    setEmail('');
    setError('');
    inputRef.current?.focus();
  };

  const appendDomain = (domain: string) => {
    const local = email.split('@')[0] || '';
    setEmail(local + domain);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary mb-1 text-balance">
          What is your email address?
        </h1>
        <p className="text-sm font-medium text-text-secondary m-0">
          We'll send you a 6-digit confirmation code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="relative flex items-center">
          <Input
            ref={inputRef}
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            autoFocus
            placeholder="chinedu@gmail.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
            error={!!error}
            className="h-12 text-base font-medium pr-12 rounded-xl"
          />
          {email && !isLoading && (
            <button 
              type="button" 
              onClick={handleClear}
              className="absolute right-2 flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)]"
              aria-label="Clear"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-2.5">
          <button 
            type="button" 
            onClick={() => appendDomain('@gmail.com')}
            className="h-8 px-3 border border-[var(--color-proto-tint2)] rounded-lg bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)] text-xs font-bold transition-colors"
          >
            @gmail.com
          </button>
          <button 
            type="button" 
            onClick={() => appendDomain('@yahoo.com')}
            className="h-8 px-3 border border-[var(--color-proto-tint2)] rounded-lg bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)] text-xs font-bold transition-colors"
          >
            @yahoo.com
          </button>
        </div>

        {error && (
          <p className="flex items-start gap-2 mt-2.5 text-sm leading-snug font-semibold text-status-danger animate-in shake" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-none" strokeWidth={2.5} />
            <span>{error}</span>
          </p>
        )}

        <ul className="list-none m-0 p-0 mt-5 grid gap-3">
          <li className="flex items-center gap-3 text-sm font-semibold text-text-primary">
            <span className="flex-none grid place-items-center w-8 h-8 rounded-lg bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)]">
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <span>ParkDrop is free.</span>
          </li>
          <li className="flex items-center gap-3 text-sm font-semibold text-text-primary">
            <span className="flex-none grid place-items-center w-8 h-8 rounded-lg bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)]">
              <MessageSquare className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <span>We will email you a code.</span>
          </li>
          <li className="flex items-center gap-3 text-sm font-semibold text-text-primary">
            <span className="flex-none grid place-items-center w-8 h-8 rounded-lg bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)]">
              <Shield className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <span>We never sell your email.</span>
          </li>
        </ul>

        <div className="mt-auto pt-6 flex flex-col gap-3 items-center">
          <Button 
            type="submit" 
            size="lg" 
            disabled={!email.trim() || isLoading} 
            loading={isLoading}
            className="w-full h-12 text-base font-bold"
          >
            Continue
          </Button>
          
          <p className="text-center text-xs font-medium text-text-muted">
            By continuing you accept our <a href="#" className="text-[var(--color-proto-blue-d)] font-semibold underline underline-offset-2">Privacy Notice</a>.
          </p>
        </div>
      </form>
    </div>
  );
}
