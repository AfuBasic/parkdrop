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
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 text-text-primary">{AuthStrings.nameTitle}</h1>
        <p className="text-sm font-medium text-text-secondary m-0">{AuthStrings.nameSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <Field label={AuthStrings.firstNameLabel} htmlFor="firstName">
          <Input
            id="firstName"
            autoFocus
            placeholder={AuthStrings.firstNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 text-base font-medium rounded-xl"
          />
        </Field>

        <div className="mt-auto pt-6">
          <Button type="submit" className="w-full h-12 text-base font-bold" size="lg" disabled={!name.trim()}>
            {AuthStrings.continue}
          </Button>
        </div>
      </form>
    </div>
  );
}
