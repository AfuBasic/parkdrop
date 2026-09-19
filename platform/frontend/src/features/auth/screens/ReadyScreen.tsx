
import { AuthStrings } from '../strings';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface ReadyScreenProps {
  onComplete: () => void;
}

export function ReadyScreen({ onComplete }: ReadyScreenProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center animate-in zoom-in-95 duration-500 text-center">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-4">{AuthStrings.readyTitle}</h1>
      <p className="text-muted-foreground text-lg mb-12 max-w-[280px]">
        {AuthStrings.readySubtitle}
      </p>

      <Button className="w-full" size="lg" onClick={onComplete}>
        {AuthStrings.goToHome}
      </Button>
    </div>
  );
}
