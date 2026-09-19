import * as React from 'react';
import { AuthStrings } from '../strings';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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
        <h1 className="text-3xl font-bold tracking-tight mb-2">{AuthStrings.pickupPointTitle}</h1>
        <p className="text-muted-foreground text-lg">{AuthStrings.pickupPointSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locationName">{AuthStrings.pickupPointLabel}</Label>
            <Input
              id="locationName"
              autoFocus
              placeholder={AuthStrings.pickupPointPlaceholder}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parkName">{AuthStrings.parkNameLabel}</Label>
            <Input
              id="parkName"
              placeholder={AuthStrings.parkNamePlaceholder}
              value={parkName}
              onChange={(e) => setParkName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {locationName && (
          <div className="mt-4 p-4 bg-muted rounded-xl border border-border animate-in fade-in">
            <Label className="text-xs uppercase text-muted-foreground mb-2 block">{AuthStrings.smsPreviewTitle}</Label>
            <p className="text-sm font-medium">
              {AuthStrings.smsPreviewText(firstName, locationName, parkName)}
            </p>
          </div>
        )}

        <div className="mt-auto">
          <Button type="submit" className="w-full" size="lg" disabled={!locationName.trim() || isLoading}>
            {isLoading ? AuthStrings.processing : AuthStrings.continue}
          </Button>
        </div>
      </form>
    </div>
  );
}
