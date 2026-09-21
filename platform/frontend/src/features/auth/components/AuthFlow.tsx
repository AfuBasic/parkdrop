import * as React from 'react';
import { AuthLayout } from './AuthLayout';
import { EmailScreen } from '@/features/auth/screens/EmailScreen';
import { CodeScreen } from '@/features/auth/screens/CodeScreen';
import { NameScreen } from '@/features/auth/screens/NameScreen';
import { PinSetupScreen } from '@/features/auth/screens/PinSetupScreen';
import { PickupPointScreen } from '@/features/auth/screens/PickupPointScreen';
import { ReadyScreen } from '@/features/auth/screens/ReadyScreen';
import { authApi } from '@/features/auth/api';
import { db } from '@/lib/db';
import { hashPin, generateSalt } from '@/lib/pin';
import { ProblemLoggingInSheet } from './ProblemLoggingInSheet';
import { useAuth } from '@/features/auth/AuthContext';
import { notify } from '@/lib/notify';

type Step = 'email' | 'code' | 'name' | 'pin' | 'pickup' | 'ready';

interface AuthFlowProps {
  initialEmail?: string;
}

const DRAFT_STORAGE_KEY = 'parkdrop_onboarding_draft';

interface OnboardingDraft {
  step: Step;
  email: string;
  challengeId: number | null;
  firstName: string;
  pin: string;
}

function loadDraft(): OnboardingDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: OnboardingDraft) {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage quota errors
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function AuthFlow({ initialEmail = '' }: AuthFlowProps) {
  const { user: sessionUser, state: authState, setAuthenticatedUser } = useAuth();
  const draft = React.useMemo(() => loadDraft(), []);

  // Determine initial step
  const initialStep = React.useMemo<Step>(() => {
    if (draft && ['name', 'pin', 'pickup'].includes(draft.step)) {
      return draft.step;
    }
    if (authState === 'onboarding') {
      return 'name';
    }
    return 'email';
  }, [draft, authState]);

  const [step, setStep] = React.useState<Step>(initialStep);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  
  // Collected state
  const [email, setEmail] = React.useState(
    draft?.email || sessionUser?.email || initialEmail
  );
  const [challengeId, setChallengeId] = React.useState<number | null>(
    draft?.challengeId ?? null
  );
  const [firstName, setFirstName] = React.useState(
    draft?.firstName || sessionUser?.first_name || ''
  );
  const [pin, setPin] = React.useState(draft?.pin || '');

  // Persist draft on state changes if in onboarding phase
  React.useEffect(() => {
    if (['name', 'pin', 'pickup'].includes(step)) {
      saveDraft({
        step,
        email,
        challengeId,
        firstName,
        pin,
      });
    }
  }, [step, email, challengeId, firstName, pin]);

  const handleEmailSubmit = async (submittedEmail: string) => {
    setIsLoading(true);
    setError('');
    try {
      await authApi.requestCode({
        email: submittedEmail,
        purpose: 'auth',
      });
      setEmail(submittedEmail);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send confirmation code');
      notify.error(err, 'Failed to send confirmation code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await authApi.verifyCode({
        email,
        code,
        purpose: 'auth',
      });

      if (res.outcome === 'authenticated') {
        clearDraft();
        notify.success(`Welcome back, ${res.user.first_name || 'Owner'}!`);
        await setAuthenticatedUser(res.user, res.business);
        return;
      }

      if (res.outcome === 'new_user') {
        setChallengeId(res.challenge_id);
        if (res.user?.first_name) {
          setFirstName(res.user.first_name);
        }
        setStep('name');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired confirmation code');
      notify.error(err, 'Invalid or expired confirmation code');
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
    setIsLoading(true);
    try {
      const deviceUuid = crypto.randomUUID();
      const res = await authApi.completeOnboarding({
        email,
        first_name: firstName,
        pickup_point_name: locationName,
        park_name: parkName,
        challenge_id: challengeId ?? 0,
        device_uuid: deviceUuid,
        device_name: navigator.userAgent.substring(0, 255),
      });

      // Hash PIN and store in IndexedDB
      const salt = generateSalt();
      const hashedPin = await hashPin(pin, salt);

      await db.deviceMeta.put({
        device_uuid: deviceUuid,
        user_id: res.user.id,
        business_id: res.business.id,
        first_name: res.user.first_name,
        email: res.user.email || email,
        pin_hash: hashedPin,
        pin_salt: salt,
        authorized: true,
      });

      clearDraft();
      await setAuthenticatedUser(res.user, res.business);
      setStep('ready');
    } catch (err: any) {
      notify.error(err, 'Onboarding failed');
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

  const [showProblemHelp, setShowProblemHelp] = React.useState(false);

  const handleResetToEmail = () => {
    clearDraft();
    setStep('email');
  };

  return (
    <>
      <AuthLayout showBack={step !== 'email' && step !== 'ready'} onBack={goBack}>
        {step === 'email' && (
          <EmailScreen 
            initialEmail={email} 
            onContinue={handleEmailSubmit} 
            onProblemLoggingIn={() => setShowProblemHelp(true)}
            isLoading={isLoading} 
          />
        )}
        {step === 'code' && (
          <CodeScreen 
            email={email} 
            onVerify={handleCodeSubmit} 
            onResend={() => handleEmailSubmit(email)} 
            onProblemLoggingIn={() => setShowProblemHelp(true)}
            isLoading={isLoading} 
            error={error}
            onChangeEmail={handleResetToEmail}
          />
        )}
        {step === 'name' && (
          <NameScreen 
            initialName={firstName} 
            onContinue={handleNameSubmit} 
          />
        )}
        {step === 'pin' && <PinSetupScreen onContinue={handlePinSubmit} />}
        {step === 'pickup' && (
          <PickupPointScreen 
            firstName={firstName} 
            onContinue={handlePickupSubmit} 
            isLoading={isLoading} 
          />
        )}
        {step === 'ready' && <ReadyScreen onComplete={() => window.location.href = '/'} />}
      </AuthLayout>

      <ProblemLoggingInSheet
        open={showProblemHelp}
        onOpenChange={setShowProblemHelp}
        email={email}
      />
    </>
  );
}
