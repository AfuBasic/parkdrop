import * as React from 'react';
import { AuthLayout } from './AuthLayout';
import { RememberedReauthScreen } from '../screens/RememberedReauthScreen';
import { CodeScreen } from '../screens/CodeScreen';
import { authApi } from '../api';
import { useAuth } from '../AuthContext';
import { notify } from '@/lib/notify';
import type { RememberedIdentity } from '@/lib/db';

import { ProblemLoggingInDialog } from './ProblemLoggingInDialog';

interface RememberedReauthFlowProps {
  identity: RememberedIdentity;
  onSwitchToEmail: () => void;
}

type Step = 'prompt' | 'code';

export function RememberedReauthFlow({ identity, onSwitchToEmail }: RememberedReauthFlowProps) {
  const { setAuthenticatedUser } = useAuth();
  const [step, setStep] = React.useState<Step>('prompt');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showProblemHelp, setShowProblemHelp] = React.useState(false);

  const handleSendCode = async (targetEmail: string) => {
    setIsLoading(true);
    setError('');
    try {
      await authApi.requestCode({
        email: targetEmail,
        purpose: 'auth',
      });
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send confirmation code');
      notify.error(err, 'Failed to send confirmation code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.verifyCode({
        email: identity.email,
        code,
        purpose: 'auth',
      });

      if (res.outcome === 'authenticated') {
        notify.success(`Welcome back, ${res.user.first_name || 'Owner'}!`);
        await setAuthenticatedUser(res.user, res.business);
        return;
      }

      // If somehow not found, switch to full flow
      onSwitchToEmail();
    } catch (err: any) {
      setError(err.message || 'Invalid or expired confirmation code');
      notify.error(err, 'Invalid or expired confirmation code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthLayout 
        showBack={step === 'code'} 
        onBack={() => {
          setStep('prompt');
          setError('');
        }}
      >
        {step === 'prompt' && (
          <RememberedReauthScreen
            identity={identity}
            onContinue={handleSendCode}
            onSwitchAccount={onSwitchToEmail}
            isLoading={isLoading}
          />
        )}
        {step === 'code' && (
          <CodeScreen
            email={identity.email}
            onVerify={handleVerifyCode}
            onResend={() => handleSendCode(identity.email)}
            onProblemLoggingIn={() => setShowProblemHelp(true)}
            isLoading={isLoading}
            error={error}
            onChangeEmail={onSwitchToEmail}
          />
        )}
      </AuthLayout>

      <ProblemLoggingInDialog
        open={showProblemHelp}
        onOpenChange={setShowProblemHelp}
        email={identity.email}
      />
    </>
  );
}
