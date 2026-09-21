import * as React from 'react';
import { AuthStrings } from '@/features/auth/strings';
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
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 text-text-primary">{AuthStrings.pickupPointTitle}</h1>
        <p className="text-sm font-medium text-text-secondary m-0">{AuthStrings.pickupPointSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="space-y-4">
          <Field label={AuthStrings.pickupPointLabel} htmlFor="locationName">
            <Input
              id="locationName"
              autoFocus
              placeholder={AuthStrings.pickupPointPlaceholder}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              disabled={isLoading}
              className="h-12 text-base font-medium rounded-xl"
            />
          </Field>

          <Field label={AuthStrings.parkNameLabel} htmlFor="parkName">
            <Input
              id="parkName"
              placeholder={AuthStrings.parkNamePlaceholder}
              value={parkName}
              onChange={(e) => setParkName(e.target.value)}
              disabled={isLoading}
              className="h-12 text-base font-medium rounded-xl"
            />
          </Field>
        </div>

        {locationName && (
          <div className="mt-4 p-3.5 bg-surface-subtle rounded-xl border border-border-default animate-in fade-in">
            <span className="text-[11px] uppercase tracking-wider text-text-muted mb-1.5 block font-bold">{AuthStrings.smsPreviewTitle}</span>
            <p className="text-xs font-medium leading-relaxed text-text-primary">
              {AuthStrings.smsPreviewText(firstName, locationName, parkName)}
            </p>
          </div>
        )}

        <div className="mt-auto pt-6">
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold" 
            size="lg" 
            disabled={!locationName.trim()} 
            loading={isLoading}
          >
            {AuthStrings.continue}
          </Button>
        </div>
      </form>
    </div>
  );
}
