import * as React from 'react';
import { AuthShell } from '../components/AuthShell';
import { PinPad } from '../components/PinPad';
import { Notice } from '../components/Notice';
import { HelpSheet } from '../components/HelpSheet';
import { AuthStrings } from '../strings';
import { MAX_PIN_ATTEMPTS } from '../config';
import { verifyPin } from '@/lib/pin';
import type { DeviceMeta } from '@/lib/db';
import { cn } from '@/lib/utils';

export interface UnlockScreenProps {
  deviceMeta: DeviceMeta;
  onUnlocked: () => void;
  onForgotPin: () => void;
  onNotYou: () => void;
  /** Called after too many wrong tries, to fall back to a code. */
  onTooManyAttempts?: () => void;
}

/**
 * Screen 7. The screen an existing user sees every single day.
 *
 * It works entirely offline: the PIN is checked against a hash held on this
 * phone, so a user with no data can still open the app and look up a package.
 * That is the whole point of having a PIN rather than signing in each time.
 *
 * After five wrong tries we ask for a code instead of locking the account.
 * A lockout would strand a legitimate owner mid-shift with customers waiting,
 * which is a worse outcome than the one it protects against on a device that
 * is already in their hands.
 */
export function UnlockScreen({
  deviceMeta,
  onUnlocked,
  onForgotPin,
  onNotYou,
  onTooManyAttempts,
}: UnlockScreenProps) {
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [attempts, setAttempts] = React.useState(0);
  const [checking, setChecking] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const name = deviceMeta.first_name || 'there';

  const handleComplete = async (value: string) => {
    if (!deviceMeta.pin_hash || !deviceMeta.pin_salt) return;

    setChecking(true);
    const valid = await verifyPin(value, deviceMeta.pin_hash, deviceMeta.pin_salt);
    setChecking(false);

    if (valid) {
      onUnlocked();
      return;
    }

    const used = attempts + 1;
    setAttempts(used);
    navigator.vibrate?.(60);

    if (used >= MAX_PIN_ATTEMPTS) {
      setError(AuthStrings.pinAttemptsUsed);
      onTooManyAttempts?.();
      return;
    }

    setError(AuthStrings.pinWrong);
    window.setTimeout(() => setPin(''), 320);
  };

  const linkClass = cn(
    'inline-flex items-center justify-center min-h-[var(--pd-tap-min)] px-4 rounded-full',
    'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-blue-hover)]',
    'hover:bg-[var(--pd-tint)] active:scale-[0.97]',
    'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
  );

  return (
    <>
      <AuthShell
        size="medium"
        avatarInitial={name.charAt(0)}
        onHelp={() => setHelpOpen(true)}
        showHero={false}
        foot={
          <div className="flex items-center justify-center gap-2">
            <button type="button" onClick={onForgotPin} className={linkClass}>
              {AuthStrings.forgotPin}
            </button>
            <span className="text-[var(--pd-line)]" aria-hidden="true">
              •
            </span>
            <button type="button" onClick={onNotYou} className={linkClass}>
              {AuthStrings.notYou}
            </button>
          </div>
        }
      >
        <h1 className="m-0 mb-2 text-[var(--pd-size-title)] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--pd-navy)] text-balance">
          {AuthStrings.welcomeBack(name)}
        </h1>
        <p className="m-0 text-[var(--pd-size-body)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
          {AuthStrings.unlockSubtitle}
        </p>

        {error && (
          <Notice tone="error" className="mt-4">
            {error}
          </Notice>
        )}

        <div className="mt-7 pb-6">
          <PinPad
            value={pin}
            onChange={(value) => {
              setPin(value);
              if (error && attempts < MAX_PIN_ATTEMPTS) setError('');
            }}
            onComplete={handleComplete}
            error={!!error}
            disabled={checking || attempts >= MAX_PIN_ATTEMPTS}
            label={AuthStrings.unlockSubtitle}
          />
        </div>
      </AuthShell>

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} screenName="Welcome back" />
    </>
  );
}
