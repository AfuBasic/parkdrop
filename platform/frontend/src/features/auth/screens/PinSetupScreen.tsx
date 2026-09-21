import * as React from 'react';
import { AuthStrings } from '@/features/auth/strings';
import { PinInput } from '@/features/auth/components/PinInput';


interface PinSetupScreenProps {
  onContinue: (pin: string) => void;
}

export function PinSetupScreen({ onContinue }: PinSetupScreenProps) {
  const [step, setStep] = React.useState<'setup' | 'confirm'>('setup');
  const [pin, setPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSetupComplete = (val: string) => {
    if (val.length === 4) {
      setTimeout(() => setStep('confirm'), 300);
    }
  };

  const handleConfirmComplete = (val: string) => {
    if (val.length === 4) {
      if (val === pin) {
        onContinue(pin);
      } else {
        setError(AuthStrings.pinMismatch);
        setConfirmPin('');
      }
    }
  };

  if (step === 'setup') {
    return (
      <div key="setup" className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary mb-1">{AuthStrings.pinSetupTitle}</h1>
          <p className="text-sm font-medium text-text-secondary m-0">{AuthStrings.pinSetupSubtitle}</p>
        </div>
        <div className="flex flex-col items-center flex-1 pt-4">
          <PinInput length={4} value={pin} onChange={setPin} onComplete={handleSetupComplete} secure />
        </div>
      </div>
    );
  }

  return (
    <div key="confirm" className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary mb-1">{AuthStrings.pinConfirmTitle}</h1>
        <p className="text-sm font-medium text-text-secondary m-0">{AuthStrings.pinConfirmSubtitle}</p>
      </div>
      <div className="flex flex-col items-center flex-1 pt-4">
        <PinInput 
          length={4} 
          value={confirmPin} 
          onChange={(val) => {
            setConfirmPin(val);
            if (error) setError('');
          }} 
          onComplete={handleConfirmComplete} 
          secure 
          error={!!error}
        />
        {error && <p className="text-xs text-status-danger font-semibold mt-3">{error}</p>}
      </div>
    </div>
  );
}
