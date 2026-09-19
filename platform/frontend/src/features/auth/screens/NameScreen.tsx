import * as React from 'react';
import { AuthStrings } from '../strings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface NameScreenProps {
  onContinue: (name: string) => void;
}

export function NameScreen({ onContinue }: NameScreenProps) {
  const [name, setName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onContinue(name.trim());
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{AuthStrings.nameTitle}</h1>
        <p className="text-muted-foreground text-lg">{AuthStrings.nameSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">{AuthStrings.firstNameLabel}</Label>
          <Input
            id="firstName"
            autoFocus
            placeholder={AuthStrings.firstNamePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mt-auto">
          <Button type="submit" className="w-full" size="lg" disabled={!name.trim()}>
            {AuthStrings.continue}
          </Button>
        </div>
      </form>
    </div>
  );
}
