import * as React from 'react';
import { IdentifierScreen } from '@/features/auth/screens/IdentifierScreen';
import { CodeScreen } from '@/features/auth/screens/CodeScreen';
import { NameScreen } from '@/features/auth/screens/NameScreen';
import { PinSetupScreen } from '@/features/auth/screens/PinSetupScreen';
import { PickupPointScreen } from '@/features/auth/screens/PickupPointScreen';
import { PhoneNumberScreen } from '@/features/auth/screens/PhoneNumberScreen';
import { ReadyScreen } from '@/features/auth/screens/ReadyScreen';
import { HelpSheet } from './HelpSheet';
import { InstallSheet, useInstallPrompt } from './InstallSheet';
import { authApi } from '@/features/auth/api';
import { ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import { hashPin, generateSalt } from '@/lib/pin';
import { useAuth } from '@/features/auth/AuthContext';
import { AUTH_IDENTIFIER } from '@/features/auth/config';
import { useSlowRequest } from '@/features/auth/lib/useSlowRequest';
import { useOnline } from '@/features/auth/lib/useOnline';
import { AuthStrings } from '@/features/auth/strings';
import { formatPhoneDisplay } from '@/features/auth/lib/phone';
import type { AuthUser, AuthBusiness } from '@/features/auth/types';

type Step = 'identifier' | 'code' | 'name' | 'pin' | 'pickup' | 'phone' | 'ready';

const STEP_NUMBER: Record<Step, number> = {
  identifier: 1,
  code: 2,
  name: 3,
  pin: 4,
  pickup: 5,
  phone: 6,
  ready: 6,
};

const SCREEN_NAME: Record<Step, string> = {
  identifier: 'Your phone or email',
  code: 'Enter the code',
  name: 'Your name',
  pin: 'Choose a PIN',
  pickup: 'Your pickup point',
  phone: 'Contact phone number',
  ready: 'You are ready',
};

/**
 * Draft key. Deliberately localStorage rather than sessionStorage: a cheap
 * Android will kill a backgrounded browser tab to reclaim memory, and
 * sessionStorage goes with it. Someone who takes a call halfway through
 * setup should come back to what they typed, not to an empty first screen.
 */
const DRAFT_KEY = 'parkdrop_onboarding_draft_v3';

interface OnboardingDraft {
  step: Step;
  identifier: string;
  challengeId: number | null;
  firstName: string;
  pin: string;
  pickupPointName: string;
  parkName: string;
  contactPhone: string;
}

const EMPTY_DRAFT: OnboardingDraft = {
  step: 'identifier',
  identifier: '',
  challengeId: null,
  firstName: '',
  pin: '',
  pickupPointName: '',
  parkName: '',
  contactPhone: '',
};

function loadDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_DRAFT, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function persistDraft(draft: OnboardingDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or blocked. Losing the draft is bad but not fatal.
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing useful to do.
  }
}

export interface AuthFlowProps {
  initialIdentifier?: string;
}

export function AuthFlow({ initialIdentifier = '' }: AuthFlowProps) {
  const { user: sessionUser, state: authState, setAuthenticatedUser } = useAuth();
  const restored = React.useMemo(() => loadDraft(), []);
  const online = useOnline();
  const request = useSlowRequest();

  const [step, setStep] = React.useState<Step>(() => {
    if (restored && restored.step !== 'ready') return restored.step;
    if (authState === 'onboarding') return 'name';
    return 'identifier';
  });

  const [identifier, setIdentifier] = React.useState(
    restored?.identifier || sessionUser?.email || initialIdentifier
  );
  const [challengeId, setChallengeId] = React.useState<number | null>(restored?.challengeId ?? null);
  const [firstName, setFirstName] = React.useState(
    restored?.firstName || sessionUser?.first_name || ''
  );
  const [pin, setPin] = React.useState(restored?.pin || '');
  const [pickupPointName, setPickupPointName] = React.useState(restored?.pickupPointName || '');
  const [parkName, setParkName] = React.useState(restored?.parkName || '');
  const [contactPhone, setContactPhone] = React.useState(
    restored?.contactPhone || (AUTH_IDENTIFIER === 'phone' ? identifier : '')
  );

  const [error, setError] = React.useState('');
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [installOpen, setInstallOpen] = React.useState(false);
  const { canInstall, install } = useInstallPrompt();

  /**
   * Who we just created, held until the user taps through the Ready screen.
   */
  const [completed, setCompleted] = React.useState<{
    user: AuthUser;
    business: AuthBusiness;
  } | null>(null);

  // Keep every typed value on disk, at every step, so Android back, a
  // rotation or the tab being killed never costs the user their typing.
  React.useEffect(() => {
    if (step === 'ready') return;
    persistDraft({
      step,
      identifier,
      challengeId,
      firstName,
      pin,
      pickupPointName,
      parkName,
      contactPhone,
    });
  }, [step, identifier, challengeId, firstName, pin, pickupPointName, parkName, contactPhone]);

  const readableError = (err: unknown, ours: string) => {
    if (err instanceof ApiError && err.status === 429) {
      return 'Too many tries. Wait a minute, then try again.';
    }
    if (import.meta.env.DEV && err instanceof Error) {
      console.debug('[auth] request failed:', err.message);
    }
    return ours;
  };

  const sendCode = async (target: string) => {
    if (request.busy) return;
    setError('');
    request.start();

    try {
      await authApi.requestCode({ email: target, purpose: 'auth' });
      setIdentifier(target);
      if (AUTH_IDENTIFIER === 'phone' && !contactPhone) {
        setContactPhone(target);
      }
      request.finish();
      setStep('code');
    } catch (err) {
      request.finish();
      setError(readableError(err, 'We could not send your code. Check your data and try again.'));
    }
  };

  const submitCode = async (code: string) => {
    if (request.busy) return;
    setError('');
    request.start();

    try {
      const result = await authApi.verifyCode({ email: identifier, code, purpose: 'auth' });

      if (result.outcome === 'authenticated') {
        request.finish();
        clearDraft();
        await setAuthenticatedUser(result.user, result.business);
        return;
      }

      setChallengeId(result.challenge_id);
      if (result.user?.first_name) setFirstName(result.user.first_name);
      request.finish();
      setStep('name');
    } catch (err) {
      request.finish();
      setError(readableError(err, AuthStrings.codeWrong(AUTH_IDENTIFIER)));
    }
  };

  const proceedFromPickup = (pickup: string, park: string) => {
    setPickupPointName(pickup);
    setParkName(park);
    setError('');
    setStep('phone');
  };

  const completeSetup = async (phoneToSave: string) => {
    if (request.busy) return;
    setContactPhone(phoneToSave);
    setError('');
    request.start();

    const deviceUuid = crypto.randomUUID();

    try {
      const result = await authApi.completeOnboarding({
        email: identifier,
        first_name: firstName,
        pickup_point_name: pickupPointName,
        park_name: parkName,
        contact_phone: phoneToSave,
        challenge_id: challengeId ?? 0,
        device_uuid: deviceUuid,
        device_name: navigator.userAgent.substring(0, 255),
      });

      const salt = generateSalt();
      const pinHash = await hashPin(pin, salt);

      await db.deviceMeta.put({
        device_uuid: deviceUuid,
        user_id: result.user.id,
        business_id: result.business.id,
        first_name: result.user.first_name,
        email: result.user.email || identifier,
        pin_hash: pinHash,
        pin_salt: salt,
        authorized: true,
      });

      request.finish();
      clearDraft();
      setCompleted({ user: result.user, business: result.business });
      setStep('ready');
    } catch (err) {
      request.finish();
      setError(readableError(err, 'We could not save your pickup point. Try again.'));
    }
  };

  const goBack = () => {
    setError('');
    request.reset();
    switch (step) {
      case 'code':
        setStep('identifier');
        break;
      case 'name':
        setStep('code');
        break;
      case 'pin':
        setStep('name');
        break;
      case 'pickup':
        setStep('pin');
        break;
      case 'phone':
        setStep('pickup');
        break;
      default:
        break;
    }
  };

  const openHelp = () => setHelpOpen(true);

  return (
    <>
      {step === 'identifier' && (
        <IdentifierScreen
          initialValue={identifier}
          onContinue={sendCode}
          onHelp={openHelp}
          busy={request.busy}
          requestError={error}
          slowNetwork={request.showReassurance}
          timedOut={request.timedOut}
          onRetry={() => sendCode(identifier)}
          offline={!online}
        />
      )}

      {step === 'code' && (
        <CodeScreen
          identifier={identifier}
          onVerify={submitCode}
          onResend={() => sendCode(identifier)}
          onChangeIdentifier={() => {
            setError('');
            setStep('identifier');
          }}
          onBack={goBack}
          onHelp={openHelp}
          busy={request.busy}
          error={error}
          step={STEP_NUMBER.code}
          totalSteps={6}
          slowNetwork={request.showReassurance}
          timedOut={request.timedOut}
        />
      )}

      {step === 'name' && (
        <NameScreen
          initialName={firstName}
          onContinue={(name) => {
            setFirstName(name);
            setStep('pin');
          }}
          onBack={goBack}
          onHelp={openHelp}
          step={STEP_NUMBER.name}
          totalSteps={6}
        />
      )}

      {step === 'pin' && (
        <PinSetupScreen
          onContinue={(chosen) => {
            setPin(chosen);
            setStep('pickup');
          }}
          onBack={goBack}
          onHelp={openHelp}
          phone={AUTH_IDENTIFIER === 'phone' ? identifier : null}
          step={STEP_NUMBER.pin}
          totalSteps={6}
        />
      )}

      {step === 'pickup' && (
        <PickupPointScreen
          initialPickupName={pickupPointName}
          initialParkName={parkName}
          onContinue={proceedFromPickup}
          onBack={goBack}
          onHelp={openHelp}
          busy={request.busy}
          requestError={error}
          slowNetwork={request.showReassurance}
          timedOut={request.timedOut}
          step={STEP_NUMBER.pickup}
          totalSteps={6}
        />
      )}

      {step === 'phone' && (
        <PhoneNumberScreen
          initialPhone={contactPhone}
          pickupPointName={pickupPointName}
          parkName={parkName}
          onContinue={completeSetup}
          onBack={goBack}
          onHelp={openHelp}
          busy={request.busy}
          requestError={error}
          slowNetwork={request.showReassurance}
          timedOut={request.timedOut}
          step={STEP_NUMBER.phone}
          totalSteps={6}
        />
      )}

      {step === 'ready' && (
        <ReadyScreen
          firstName={firstName}
          pickupPointName={pickupPointName}
          parkName={parkName}
          phone={formatPhoneDisplay(contactPhone)}
          onStart={async () => {
            if (completed) await setAuthenticatedUser(completed.user, completed.business);
          }}
          onEditPickupPoint={() => setStep('pickup')}
          onEditPhone={() => setStep('phone')}
          onShowInstall={async () => {
            if (canInstall && (await install())) return;
            setInstallOpen(true);
          }}
          onHelp={openHelp}
        />
      )}

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} screenName={SCREEN_NAME[step]} />
      <InstallSheet open={installOpen} onOpenChange={setInstallOpen} />
    </>
  );
}
