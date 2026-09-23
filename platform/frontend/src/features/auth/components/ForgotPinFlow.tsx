import * as React from 'react';
import { CodeScreen } from '@/features/auth/screens/CodeScreen';
import { PinSetupScreen } from '@/features/auth/screens/PinSetupScreen';
import { HelpSheet } from './HelpSheet';
import { authApi } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthContext';
import { useSlowRequest } from '@/features/auth/lib/useSlowRequest';
import { AuthStrings } from '@/features/auth/strings';
import { AUTH_IDENTIFIER } from '@/features/auth/config';
import { hashPin, generateSalt } from '@/lib/pin';
import { db, type DeviceMeta, type RememberedIdentity } from '@/lib/db';

export interface ForgotPinFlowProps {
  deviceMeta: DeviceMeta;
  rememberedIdentity?: RememberedIdentity | null;
  onCancel: () => void;
}

type Step = 'code' | 'newPin';

/**
 * Resetting a forgotten PIN: confirm with a code, then choose a new one.
 *
 * The user is sent straight to choosing a replacement rather than being told
 * to go and find a settings page. Someone who has just been locked out of the
 * app mid-shift needs to be working again in the next thirty seconds, and a
 * device left with no PIN at all is a worse state to leave them in.
 *
 * The step counter is replaced with "Reset your PIN", since this is a detour
 * and not one of the five setup steps.
 */
export function ForgotPinFlow({ deviceMeta, rememberedIdentity, onCancel }: ForgotPinFlowProps) {
  const { setAuthenticatedUser, unlock } = useAuth();
  const [step, setStep] = React.useState<Step>('code');
  const [error, setError] = React.useState('');
  const [helpOpen, setHelpOpen] = React.useState(false);
  const request = useSlowRequest();

  const identifier = deviceMeta.email || rememberedIdentity?.email || '';
  const sentRef = React.useRef(false);

  const message = (err: unknown, fallback: string) =>
    (err instanceof Error && err.message) || fallback;

  const sendCode = React.useCallback(async () => {
    if (!identifier) {
      setError('We do not have a way to reach you on this phone. Sign in again to continue.');
      return;
    }
    if (request.busy) return;

    setError('');
    request.start();

    try {
      await authApi.requestCode({
        email: identifier,
        purpose: 'pin_reset',
        device_uuid: deviceMeta.device_uuid,
      });
      request.finish();
    } catch (err) {
      request.finish();
      setError(message(err, 'We could not send your code. Try again.'));
    }
  }, [identifier, deviceMeta.device_uuid, request]);

  // Send one code on arrival — the user asked for this by tapping Forgot PIN,
  // so making them tap again to receive it would be a wasted step.
  React.useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    sendCode();
  }, [sendCode]);

  const verifyCode = async (code: string) => {
    if (request.busy) return;
    setError('');
    request.start();

    try {
      const result = await authApi.verifyCode({
        email: identifier,
        code,
        purpose: 'pin_reset',
        device_uuid: deviceMeta.device_uuid,
      });

      request.finish();

      if (result.outcome === 'authenticated') {
        await setAuthenticatedUser(result.user, result.business);
        setStep('newPin');
        return;
      }

      setError('We could not confirm that code. Try again.');
    } catch (err) {
      request.finish();
      setError(message(err, AuthStrings.codeWrong(AUTH_IDENTIFIER)));
    }
  };

  const saveNewPin = async (pin: string) => {
    const salt = generateSalt();
    const pinHash = await hashPin(pin, salt);

    if (deviceMeta.id) {
      await db.deviceMeta.update(deviceMeta.id, { pin_hash: pinHash, pin_salt: salt });
    } else {
      await db.deviceMeta.put({ ...deviceMeta, pin_hash: pinHash, pin_salt: salt });
    }

    // They have just proven who they are and set a new PIN, so let them in.
    unlock();
  };

  return (
    <>
      {step === 'code' && (
        <CodeScreen
          identifier={identifier}
          onVerify={verifyCode}
          onResend={sendCode}
          onChangeIdentifier={onCancel}
          onBack={onCancel}
          onHelp={() => setHelpOpen(true)}
          busy={request.busy}
          error={error}
          step={1}
          totalSteps={2}
          stepLabelOverride={AuthStrings.resetPinTitle}
          slowNetwork={request.showReassurance}
          timedOut={request.timedOut}
        />
      )}

      {step === 'newPin' && (
        <PinSetupScreen
          onContinue={saveNewPin}
          onBack={onCancel}
          onHelp={() => setHelpOpen(true)}
          step={2}
          totalSteps={2}
          stepLabelOverride={AuthStrings.resetPinTitle}
          titleOverride={AuthStrings.newPinTitle}
          subtitleOverride={AuthStrings.newPinSubtitle}
        />
      )}

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} screenName="Reset your PIN" />
    </>
  );
}
