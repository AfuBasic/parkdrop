import * as React from 'react';
import { AuthStrings } from '../strings';
import { PinInput } from '../components/PinInput';


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
      <div key="setup" className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="mb-[22px]">
          <h1 className="text-2xl sm:text-[26px] font-[800] tracking-tight text-text-primary mb-1">{AuthStrings.pinSetupTitle}</h1>
          <p className="text-base font-[600] text-text-secondary m-0">{AuthStrings.pinSetupSubtitle}</p>
        </div>
        <div className="flex flex-col items-center flex-1 pt-4">
          <PinInput length={4} value={pin} onChange={setPin} onComplete={handleSetupComplete} secure />
        </div>
      </div>
    );
  }

  return (
    <div key="confirm" className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-[22px]">
        <h1 className="text-2xl sm:text-[26px] font-[800] tracking-tight text-text-primary mb-1">{AuthStrings.pinConfirmTitle}</h1>
        <p className="text-base font-[600] text-text-secondary m-0">{AuthStrings.pinConfirmSubtitle}</p>
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
        {error && <p className="text-sm text-status-danger font-medium mt-4">{error}</p>}
      </div>
    </div>
  );
}
