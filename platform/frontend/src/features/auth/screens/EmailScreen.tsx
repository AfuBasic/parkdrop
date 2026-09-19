import * as React from 'react';
import { AuthStrings } from '../strings';
import { Field, Input, Button } from '@/design-system';

interface EmailScreenProps {
  initialEmail?: string;
  onContinue: (email: string) => void;
  isLoading?: boolean;
}

export function EmailScreen({ initialEmail = '', onContinue, isLoading }: EmailScreenProps) {
  const [email, setEmail] = React.useState(initialEmail);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(AuthStrings.invalidEmail);
      return;
    }
    setError('');
    onContinue(trimmed.toLowerCase());
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="mb-6 md:mb-8 text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-text-primary">
          {AuthStrings.emailTitle}
        </h1>
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
          {AuthStrings.emailSubtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6">
        <Field label={AuthStrings.emailLabel} htmlFor="email" error={error}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            autoFocus
            placeholder={AuthStrings.emailPlaceholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
            error={!!error}
            className="text-base sm:text-sm font-medium"
          />
        </Field>

        <div className="mt-auto pt-6 flex flex-col gap-4 items-center">
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold" 
            size="lg" 
            disabled={!email.trim() || isLoading} 
            loading={isLoading}
          >
            {AuthStrings.continue}
          </Button>

          <a 
            href="mailto:support@parkdrop.com.ng?subject=ParkDrop%20Login%20Assistance" 
            className="text-xs sm:text-sm text-text-muted hover:text-action-primary transition-colors py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary rounded"
          >
            {AuthStrings.problemLoggingIn}
          </a>
        </div>
      </form>
    </div>
  );
}
