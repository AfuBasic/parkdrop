import * as React from 'react';
import { AuthStrings } from '../strings';
import { Field, Input, Button } from '@/design-system';

interface NameScreenProps {
  initialName?: string;
  onContinue: (name: string) => void;
}

export function NameScreen({ initialName = '', onContinue }: NameScreenProps) {
  const [name, setName] = React.useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onContinue(name.trim());
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">{AuthStrings.nameTitle}</h1>
        <p className="text-text-secondary text-lg">{AuthStrings.nameSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6">
        <Field label={AuthStrings.firstNameLabel} htmlFor="firstName">
          <Input
            id="firstName"
            autoFocus
            placeholder={AuthStrings.firstNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <div className="mt-auto">
          <Button type="submit" className="w-full" size="lg" disabled={!name.trim()}>
            {AuthStrings.continue}
          </Button>
        </div>
      </form>
    </div>
  );
}
