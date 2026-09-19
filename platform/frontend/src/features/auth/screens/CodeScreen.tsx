import * as React from 'react';
import { AuthStrings } from '../strings';
import { PinInput } from '../components/PinInput';
import { Button } from '@/design-system';

interface CodeScreenProps {
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  error?: string;
}

export function CodeScreen({ email, onVerify, onResend, isLoading, error }: CodeScreenProps) {
  const [code, setCode] = React.useState('');
  const [countdown, setCountdown] = React.useState(30);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleComplete = (val: string) => {
    if (val.length === 6) {
      onVerify(val);
    }
  };

  const handleResend = () => {
    if (countdown === 0) {
      setCountdown(30);
      onResend();
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">{AuthStrings.codeTitle}</h1>
        <p className="text-text-secondary text-lg">{AuthStrings.codeSubtitle(email)}</p>
      </div>

      <div className="flex flex-col items-center flex-1 gap-8">
        <PinInput 
          length={6} 
          value={code} 
          onChange={setCode} 
          onComplete={handleComplete}
          disabled={isLoading}
          error={!!error}
        />
        
        {error && <p className="text-sm text-status-danger font-medium">{error}</p>}

        <Button 
          variant="ghost" 
          disabled={countdown > 0}
          onClick={handleResend}
          className="mt-4"
        >
          {countdown > 0 ? AuthStrings.resendCountdown(countdown) : AuthStrings.resendCode}
        </Button>

        <div className="mt-auto w-full">
          <Button 
            className="w-full" 
            size="lg" 
            disabled={code.length < 6}
            loading={isLoading}
            onClick={() => onVerify(code)}
          >
            {AuthStrings.continue}
          </Button>
        </div>
      </div>
    </div>
  );
}
