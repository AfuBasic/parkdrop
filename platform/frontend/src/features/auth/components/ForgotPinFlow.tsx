import * as React from 'react';
import { AuthLayout } from './AuthLayout';
import { CodeScreen } from '../screens/CodeScreen';
import { authApi } from '../api';
import { useAuth } from '../AuthContext';
import { notify } from '@/lib/notify';
import { db, type DeviceMeta, type RememberedIdentity } from '@/lib/db';

import { ProblemLoggingInDialog } from './ProblemLoggingInDialog';

interface ForgotPinFlowProps {
  deviceMeta: DeviceMeta;
  rememberedIdentity?: RememberedIdentity | null;
  onCancel: () => void;
}

export function ForgotPinFlow({ deviceMeta, rememberedIdentity, onCancel }: ForgotPinFlowProps) {
  const { setAuthenticatedUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showProblemHelp, setShowProblemHelp] = React.useState(false);

  // Email associated with the remembered device or remembered identity
  const email = deviceMeta.email || rememberedIdentity?.email || '';

  const handleSendCode = React.useCallback(async () => {
    if (!email) {
      setError('No email found for this device. Please sign in again.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authApi.requestCode({
        email,
        purpose: 'pin_reset',
        device_uuid: deviceMeta.device_uuid,
      });
      notify.info(`Confirmation code sent to ${email}`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to send confirmation code';
      setError(msg);
      notify.error(err, 'Failed to send confirmation code');
    } finally {
      setIsLoading(false);
    }
  }, [email, deviceMeta.device_uuid]);

  const hasSentRef = React.useRef(false);

  // Trigger code send on initial mount exactly once
  React.useEffect(() => {
    if (!hasSentRef.current) {
      hasSentRef.current = true;
      handleSendCode();
    }
  }, [handleSendCode]);

  const handleVerifyCode = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.verifyCode({
        email,
        code,
        purpose: 'pin_reset',
        device_uuid: deviceMeta.device_uuid,
      });

      if (res.outcome === 'authenticated') {
        // Successfully verified via OTP:
        // Clear old PIN on this device so user can set a new one or continue to dashboard
        if (deviceMeta.id) {
          await db.deviceMeta.update(deviceMeta.id, {
            pin_hash: undefined,
            pin_salt: undefined,
          });
        }

        notify.success('Identity verified! Please set a new PIN in your account settings.');
        await setAuthenticatedUser(res.user, res.business);
        return;
      }

      setError('Unable to authenticate. Please try again.');
    } catch (err: any) {
      const msg = err?.message || 'Invalid or expired confirmation code';
      setError(msg);
      notify.error(err, 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthLayout showBack={true} onBack={onCancel}>
        <CodeScreen
          email={email}
          onVerify={handleVerifyCode}
          onResend={handleSendCode}
          onProblemLoggingIn={() => setShowProblemHelp(true)}
          isLoading={isLoading}
          error={error}
          onChangeEmail={onCancel}
        />
      </AuthLayout>

      <ProblemLoggingInDialog
        open={showProblemHelp}
        onOpenChange={setShowProblemHelp}
        email={email}
      />
    </>
  );
}
