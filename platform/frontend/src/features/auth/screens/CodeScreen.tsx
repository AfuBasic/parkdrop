import * as React from 'react';
import { AuthStrings } from '../strings';
import { PinInput } from '../components/PinInput';
import { Button } from '@/components/ui/button';

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
        <h1 className="text-3xl font-bold tracking-tight mb-2">{AuthStrings.codeTitle}</h1>
        <p className="text-muted-foreground text-lg">{AuthStrings.codeSubtitle(email)}</p>
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
        
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}

        <Button 
          variant="ghost" 
          disabled={countdown > 0 || isLoading}
          onClick={handleResend}
          className="mt-4"
        >
          {countdown > 0 ? AuthStrings.resendCountdown(countdown) : AuthStrings.resendCode}
        </Button>

        <div className="mt-auto w-full">
          <Button 
            className="w-full" 
            size="lg" 
            disabled={isLoading || code.length < 6}
            onClick={() => onVerify(code)}
          >
            {isLoading ? AuthStrings.processing : AuthStrings.continue}
          </Button>
        </div>
      </div>
    </div>
  );
}
