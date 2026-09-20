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
      <div className="mb-6">
        <h1 className="text-[30px] leading-[1.14] font-[800] tracking-[-0.025em] text-text-primary mb-2 text-balance">
          What is your email address?
        </h1>
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
            className="text-[22px] font-[700] pr-14"
          />
          {email && !isLoading && (
            <button 
              type="button" 
              onClick={handleClear}
              className="absolute right-2 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)]"
              aria-label="Clear"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button 
            type="button" 
            onClick={() => appendDomain('@gmail.com')}
            className="h-12 px-4 border-2 border-[var(--color-proto-tint2)] rounded-[14px] bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)] text-[17px] font-[800]"
          >
            @gmail.com
          </button>
          <button 
            type="button" 
            onClick={() => appendDomain('@yahoo.com')}
            className="h-12 px-4 border-2 border-[var(--color-proto-tint2)] rounded-[14px] bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)] text-[17px] font-[800]"
          >
            @yahoo.com
          </button>
        </div>

        {error && (
          <p className="flex items-start gap-2 mt-3 text-[17px] leading-[1.35] font-[700] text-status-danger animate-in shake" role="alert">
            <AlertCircle className="w-[22px] h-[22px] mt-px flex-none" strokeWidth={2.5} />
            <span>{error}</span>
          </p>
        )}

        <ul className="list-none m-0 p-0 mt-[26px] grid gap-3.5">
          <li className="flex items-center gap-3.5 text-[18px] leading-[1.3] font-[700]">
            <span className="flex-none grid place-items-center w-10 h-10 rounded-xl bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)]">
              <CheckCircle2 className="w-[22px] h-[22px]" strokeWidth={2.5} />
            </span>
            <span>ParkDrop is free.</span>
          </li>
          <li className="flex items-center gap-3.5 text-[18px] leading-[1.3] font-[700]">
            <span className="flex-none grid place-items-center w-10 h-10 rounded-xl bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)]">
              <MessageSquare className="w-[22px] h-[22px]" strokeWidth={2.5} />
            </span>
            <span>We will email you a code.</span>
          </li>
          <li className="flex items-center gap-3.5 text-[18px] leading-[1.3] font-[700]">
            <span className="flex-none grid place-items-center w-10 h-10 rounded-xl bg-[var(--color-proto-tint)] text-[var(--color-proto-blue-d)]">
              <Shield className="w-[22px] h-[22px]" strokeWidth={2.5} />
            </span>
            <span>We never sell your email.</span>
          </li>
        </ul>

        <div className="mt-auto pt-6 flex flex-col gap-4 items-center">
          <Button 
            type="submit" 
            size="default" 
            disabled={!email.trim() || isLoading} 
            loading={isLoading}
            className="w-full"
          >
            Continue
          </Button>
          
          <p className="mt-3 text-center text-[15px] leading-[1.4] font-[600] text-text-muted">
            By continuing you accept our <a href="#" className="text-[var(--color-proto-blue-d)] font-[800] underline underline-offset-3">Privacy Notice</a>.
          </p>
        </div>
      </form>
    </div>
  );
}
