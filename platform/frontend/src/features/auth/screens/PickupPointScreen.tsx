import * as React from 'react';
import { AuthStrings } from '../strings';
import { Field, Input, Button } from '@/design-system';

interface PickupPointScreenProps {
  firstName: string;
  onContinue: (locationName: string, parkName?: string) => void;
  isLoading?: boolean;
}

export function PickupPointScreen({ firstName, onContinue, isLoading }: PickupPointScreenProps) {
  const [locationName, setLocationName] = React.useState('');
  const [parkName, setParkName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationName.trim()) {
      onContinue(locationName.trim(), parkName.trim() || undefined);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">{AuthStrings.pickupPointTitle}</h1>
        <p className="text-text-secondary text-lg">{AuthStrings.pickupPointSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6">
        <div className="space-y-4">
          <Field label={AuthStrings.pickupPointLabel} htmlFor="locationName">
            <Input
              id="locationName"
              autoFocus
              placeholder={AuthStrings.pickupPointPlaceholder}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              disabled={isLoading}
            />
          </Field>

          <Field label={AuthStrings.parkNameLabel} htmlFor="parkName">
            <Input
              id="parkName"
              placeholder={AuthStrings.parkNamePlaceholder}
              value={parkName}
              onChange={(e) => setParkName(e.target.value)}
              disabled={isLoading}
            />
          </Field>
        </div>

        {locationName && (
          <div className="mt-4 p-4 bg-surface-subtle rounded-xl border border-border-default animate-in fade-in">
            <span className="text-xs uppercase text-text-muted mb-2 block font-semibold">{AuthStrings.smsPreviewTitle}</span>
            <p className="text-sm font-medium text-text-primary">
              {AuthStrings.smsPreviewText(firstName, locationName, parkName)}
            </p>
          </div>
        )}

        <div className="mt-auto">
          <Button type="submit" className="w-full" size="lg" disabled={!locationName.trim()} loading={isLoading}>
            {AuthStrings.continue}
          </Button>
        </div>
      </form>
    </div>
  );
}
