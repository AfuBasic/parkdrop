import * as React from 'react';
import { AuthStrings } from '../strings';
import { Field, Input, Button } from '@/design-system';

interface EmailScreenProps {
  onContinue: (email: string) => void;
  isLoading?: boolean;
}

export function EmailScreen({ onContinue, isLoading }: EmailScreenProps) {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError(AuthStrings.invalidEmail);
      return;
    }
    setError('');
    onContinue(email);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{AuthStrings.emailTitle}</h1>
        <p className="text-muted-foreground text-lg">{AuthStrings.emailSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6">
        <Field label={AuthStrings.emailLabel} htmlFor="email" error={error}>
          <Input
            id="email"
            type="email"
            autoFocus
            placeholder={AuthStrings.emailPlaceholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
            error={!!error}
          />
        </Field>

        <div className="mt-auto">
          <Button type="submit" className="w-full" size="lg" disabled={!email} loading={isLoading}>
            {AuthStrings.continue}
          </Button>
        </div>
      </form>
    </div>
  );
}
