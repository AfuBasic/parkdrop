
import { AuthStrings } from '@/features/auth/strings';
import { Button } from '@/design-system';
import { CheckCircle2 } from 'lucide-react';

interface ReadyScreenProps {
  onComplete: () => void;
}

export function ReadyScreen({ onComplete }: ReadyScreenProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center animate-in zoom-in-95 duration-300 text-center py-4">
      <div className="w-16 h-16 bg-status-success-bg text-status-success rounded-full flex items-center justify-center mb-5">
        <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />
      </div>
      
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-text-primary">{AuthStrings.readyTitle}</h1>
      <p className="text-sm font-medium text-text-secondary mb-8 max-w-[280px]">
        {AuthStrings.readySubtitle}
      </p>

      <div className="w-full mt-auto pt-4">
        <Button className="w-full h-12 text-base font-bold" size="lg" onClick={onComplete}>
          {AuthStrings.goToHome}
        </Button>
      </div>
    </div>
  );
}
