import * as React from 'react';
import { RememberedReauthScreen } from '@/features/auth/screens/RememberedReauthScreen';
import { CodeScreen } from '@/features/auth/screens/CodeScreen';
import { HelpSheet } from './HelpSheet';
import { authApi } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthContext';
import { useSlowRequest } from '@/features/auth/lib/useSlowRequest';
import { AuthStrings } from '@/features/auth/strings';
import { AUTH_IDENTIFIER } from '@/features/auth/config';
import type { RememberedIdentity } from '@/lib/db';

export interface RememberedReauthFlowProps {
  identity: RememberedIdentity;
  onSwitchToNewAccount: () => void;
}

type Step = 'prompt' | 'code';

/**
 * Signing a known user back in after their session ran out.
 *
 * Reuses the same CodeScreen as first-run so there is only one code screen in
 * the app to get right, and so a returning user sees exactly what they saw the
 * first time.
 */
export function RememberedReauthFlow({
  identity,
  onSwitchToNewAccount,
}: RememberedReauthFlowProps) {
  const { setAuthenticatedUser } = useAuth();
  const [step, setStep] = React.useState<Step>('prompt');
  const [error, setError] = React.useState('');
  const [helpOpen, setHelpOpen] = React.useState(false);
  const request = useSlowRequest();

  const message = (err: unknown, fallback: string) =>
    (err instanceof Error && err.message) || fallback;

  const sendCode = async (target: string) => {
    if (request.busy) return;
    setError('');
    request.start();

    try {
      await authApi.requestCode({ email: target, purpose: 'auth' });
      request.finish();
      setStep('code');
    } catch (err) {
      request.finish();
      setError(message(err, 'We could not send your code. Try again.'));
    }
  };

  const verifyCode = async (code: string) => {
    if (request.busy) return;
    setError('');
    request.start();

    try {
      const result = await authApi.verifyCode({
        email: identity.email,
        code,
        purpose: 'auth',
      });

      if (result.outcome === 'authenticated') {
        request.finish();
        await setAuthenticatedUser(result.user, result.business);
        return;
      }

      // We thought we knew this person but the server does not: start over
      // rather than leaving them on a screen that cannot go anywhere.
      request.finish();
      onSwitchToNewAccount();
    } catch (err) {
      request.finish();
      setError(message(err, AuthStrings.codeWrong(AUTH_IDENTIFIER)));
    }
  };

  return (
    <>
      {step === 'prompt' && (
        <RememberedReauthScreen
          identity={identity}
          onContinue={sendCode}
          onSwitchAccount={onSwitchToNewAccount}
          onHelp={() => setHelpOpen(true)}
          busy={request.busy}
          error={error}
          slowNetwork={request.showReassurance}
        />
      )}

      {step === 'code' && (
        <CodeScreen
          identifier={identity.email}
          onVerify={verifyCode}
          onResend={() => sendCode(identity.email)}
          onChangeIdentifier={onSwitchToNewAccount}
          onBack={() => {
            setStep('prompt');
            setError('');
          }}
          onHelp={() => setHelpOpen(true)}
          busy={request.busy}
          error={error}
          step={2}
          totalSteps={2}
          slowNetwork={request.showReassurance}
          timedOut={request.timedOut}
        />
      )}

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} screenName="Welcome back" />
    </>
  );
}
