import * as React from 'react';
import { AuthLayout } from './AuthLayout';
import { EmailScreen } from '../screens/EmailScreen';
import { CodeScreen } from '../screens/CodeScreen';
import { NameScreen } from '../screens/NameScreen';
import { PinSetupScreen } from '../screens/PinSetupScreen';
import { PickupPointScreen } from '../screens/PickupPointScreen';
import { ReadyScreen } from '../screens/ReadyScreen';
import { authApi } from '../api';
import { db } from '@/lib/db';
import { hashPin, generateSalt } from '@/lib/pin';
import { toast } from 'sonner';

type Step = 'email' | 'code' | 'name' | 'pin' | 'pickup' | 'ready';

export function AuthFlow() {
  const [step, setStep] = React.useState<Step>('email');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  // Collected state
  const [email, setEmail] = React.useState('');
  const [challengeId, setChallengeId] = React.useState<number | null>(null);
  const [firstName, setFirstName] = React.useState('');
  const [pin, setPin] = React.useState('');

  const handleEmailSubmit = async (submittedEmail: string) => {
    setIsLoading(true);
    setError('');
    try {
      await authApi.requestChallenge({
        email: submittedEmail,
        purpose: 'registration'
      });
      setEmail(submittedEmail);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
      toast.error(err.message || 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.verifyChallenge({
        email,
        code,
        purpose: 'registration'
      });
      setChallengeId(res.challenge_id);
      setStep('name');
    } catch (err: any) {
      setError(err.message || 'Invalid code');
      toast.error(err.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = (name: string) => {
    setFirstName(name);
    setStep('pin');
  };

  const handlePinSubmit = (selectedPin: string) => {
    setPin(selectedPin);
    setStep('pickup');
  };

  const handlePickupSubmit = async (locationName: string, parkName?: string) => {
    if (!challengeId) return;
    setIsLoading(true);
    try {
      const deviceUuid = crypto.randomUUID();
      const res = await authApi.completeOnboarding({
        email,
        first_name: firstName,
        pickup_point_name: locationName,
        park_name: parkName,
        challenge_id: challengeId,
        device_uuid: deviceUuid,
        device_name: navigator.userAgent.substring(0, 255)
      });

      // Hash PIN and store in IndexedDB
      const salt = generateSalt();
      const hashedPin = await hashPin(pin, salt);

      await db.deviceMeta.put({
        device_uuid: deviceUuid,
        user_id: res.user.id,
        business_id: res.business.id,
        first_name: res.user.first_name,
        pin_hash: hashedPin,
        pin_salt: salt,
        authorized: true
      });

      setStep('ready');
    } catch (err: any) {
      toast.error(err.message || 'Onboarding failed');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    switch (step) {
      case 'code': setStep('email'); break;
      case 'name': setStep('code'); break;
      case 'pin': setStep('name'); break;
      case 'pickup': setStep('pin'); break;
      default: break;
    }
    setError('');
  };

  return (
    <AuthLayout showBack={step !== 'email' && step !== 'ready'} onBack={goBack}>
      {step === 'email' && <EmailScreen onContinue={handleEmailSubmit} isLoading={isLoading} />}
      {step === 'code' && <CodeScreen email={email} onVerify={handleCodeSubmit} onResend={() => handleEmailSubmit(email)} isLoading={isLoading} error={error} />}
      {step === 'name' && <NameScreen onContinue={handleNameSubmit} />}
      {step === 'pin' && <PinSetupScreen onContinue={handlePinSubmit} />}
      {step === 'pickup' && <PickupPointScreen firstName={firstName} onContinue={handlePickupSubmit} isLoading={isLoading} />}
      {step === 'ready' && <ReadyScreen onComplete={() => window.location.href = '/'} />}
    </AuthLayout>
  );
}
