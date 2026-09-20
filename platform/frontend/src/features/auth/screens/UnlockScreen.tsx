import * as React from 'react';
import { AuthStrings } from '../strings';
import { PinInput } from '../components/PinInput';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '@/design-system';
import { verifyPin } from '@/lib/pin';
import type { DeviceMeta } from '@/lib/db';

interface UnlockScreenProps {
  deviceMeta: DeviceMeta;
  onUnlocked: () => void;
  onLogout: () => void;
  onForgotPin?: () => void;
}

export function UnlockScreen({ deviceMeta, onUnlocked, onLogout, onForgotPin }: UnlockScreenProps) {
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);

  const handleComplete = async (val: string) => {
    if (val.length === 4 && deviceMeta.pin_hash && deviceMeta.pin_salt) {
      setIsVerifying(true);
      setError('');
      
      const isValid = await verifyPin(val, deviceMeta.pin_hash, deviceMeta.pin_salt);
      
      if (isValid) {
        onUnlocked();
      } else {
        setError(AuthStrings.incorrectPin);
        setPin(''); // Reset to try again
      }
      setIsVerifying(false);
    }
  };

  return (
    <AuthLayout showBack={false}>
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-[22px]">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--color-proto-tint)] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl sm:text-3xl font-bold text-[var(--color-proto-blue-d)]">{deviceMeta.first_name[0]}</span>
          </div>
          <h1 className="text-2xl sm:text-[26px] font-[800] tracking-tight text-center text-text-primary mb-1">
            {AuthStrings.unlockTitle(deviceMeta.first_name)}
          </h1>
          <p className="text-base font-[600] text-center text-text-secondary m-0">{AuthStrings.unlockSubtitle}</p>
        </div>

        <div className="flex flex-col items-center flex-1">
          <PinInput 
            length={4} 
            value={pin} 
            onChange={(val) => {
              setPin(val);
              if (error) setError('');
            }} 
            onComplete={handleComplete} 
            secure 
            disabled={isVerifying}
            error={!!error}
          />
          
          {error && <p className="text-sm text-status-danger font-medium mt-4">{error}</p>}

          <div className="mt-auto flex flex-col w-full gap-3 pb-8">
            {onForgotPin && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm font-semibold text-action-primary hover:bg-action-primary/10"
                onClick={onForgotPin}
              >
                {AuthStrings.forgotPin}
              </Button>
            )}

            <Button variant="ghost" className="w-full text-text-secondary" onClick={onLogout}>
              Not {deviceMeta.first_name}? Sign out
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
