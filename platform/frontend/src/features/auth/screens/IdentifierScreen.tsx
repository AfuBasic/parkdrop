import * as React from 'react';
import { BadgeCheck, MessageSquare, ShieldCheck } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { IdentifierField } from '../components/IdentifierField';
import { BigButton } from '../components/BigButton';
import { Notice } from '../components/Notice';
import { AuthStrings } from '../strings';
import { AUTH_IDENTIFIER, type IdentifierMode } from '../config';
import { isCompletePhone, toE164 } from '../lib/phone';
import { useKeyboardOpen } from '../lib/useKeyboardOpen';
import { cn } from '@/lib/utils';

export interface IdentifierScreenProps {
  mode?: IdentifierMode;
  initialValue?: string;
  /** Receives the identifier ready for the backend. */
  onContinue: (identifier: string) => void;
  onHelp: () => void;
  busy?: boolean;
  /** Error from the request itself, as opposed to validation. */
  requestError?: string;
  slowNetwork?: boolean;
  timedOut?: boolean;
  onRetry?: () => void;
  offline?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Screen 1. The first thing a new user ever sees.
 *
 * The field is deliberately NOT autofocused. Autofocusing opens the keyboard
 * immediately, which on a 640px phone hides the trust rows and the button —
 * so the very first impression would be half a screen and no visible way
 * forward. The user taps the field when they are ready.
 */
export function IdentifierScreen({
  mode = AUTH_IDENTIFIER,
  initialValue = '',
  onContinue,
  onHelp,
  busy,
  requestError,
  slowNetwork,
  timedOut,
  onRetry,
  offline,
}: IdentifierScreenProps) {
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const keyboardOpen = useKeyboardOpen();

  const isPhone = mode === 'phone';

  const validate = (): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return AuthStrings.identifierEmpty(mode);

    if (isPhone) {
      return isCompletePhone(trimmed) ? null : AuthStrings.identifierInvalid(mode);
    }

    return EMAIL_PATTERN.test(trimmed) ? null : AuthStrings.identifierInvalid(mode);
  };

  const submit = () => {
    if (busy) return;

    const problem = validate();
    if (problem) {
      // The button is never disabled, so this is where we explain what is
      // missing rather than leaving a dead control on screen.
      setError(problem);
      inputRef.current?.focus();
      // A short buzz where the device supports it; silent everywhere else.
      navigator.vibrate?.(30);
      return;
    }

    setError('');
    onContinue(isPhone ? (toE164(value) as string) : value.trim().toLowerCase());
  };

  const handleChange = (next: string) => {
    setValue(next);
    if (error) setError('');
  };

  const trustRows = [
    { icon: <BadgeCheck className="w-[19px] h-[19px]" strokeWidth={2.5} />, text: AuthStrings.trustFree },
    { icon: <MessageSquare className="w-[19px] h-[19px]" strokeWidth={2.5} />, text: AuthStrings.trustDelivery(mode) },
    { icon: <ShieldCheck className="w-[19px] h-[19px]" strokeWidth={2.5} />, text: AuthStrings.trustPrivacy(mode) },
  ];

  return (
    <AuthShell
      size="big"
      onHelp={onHelp}
      foot={
        <div className="flex flex-col gap-3">
          {timedOut ? (
            <BigButton onClick={onRetry}>{AuthStrings.tryAgain}</BigButton>
          ) : (
            <BigButton onClick={submit} busy={busy} busyLabel={AuthStrings.sendingCode}>
              {AuthStrings.continue}
            </BigButton>
          )}

          <p className="m-0 text-center text-[var(--pd-size-min)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
            By continuing you accept our{' '}
            <a
              href="/privacy.html"
              className="text-[var(--pd-blue-hover)] font-extrabold underline underline-offset-2"
            >
              {AuthStrings.privacyNoticeLink}
            </a>
            .
          </p>
        </div>
      }
    >
      <h1
        className={cn(
          'm-0 mb-2 text-[var(--pd-size-title)] font-extrabold leading-[1.15]',
          'tracking-[-0.025em] text-[var(--pd-navy)] text-balance'
        )}
      >
        {AuthStrings.identifierTitle(mode)}
      </h1>

      <div className="mt-5">
        <IdentifierField
          mode={mode}
          value={value}
          onChange={handleChange}
          error={error}
          disabled={busy}
          onSubmitRequested={submit}
          inputRef={inputRef}
        />
      </div>

      {offline && (
        <Notice tone="warning" className="mt-4">
          {AuthStrings.offline}
        </Notice>
      )}

      {timedOut && (
        <Notice tone="error" className="mt-4">
          {AuthStrings.tookTooLong}
        </Notice>
      )}

      {slowNetwork && !timedOut && (
        <Notice tone="info" className="mt-4">
          {AuthStrings.slowNetwork}
        </Notice>
      )}

      {requestError && !timedOut && (
        <Notice tone="error" className="mt-4">
          {requestError}
        </Notice>
      )}

      {/* The trust rows are the first thing to go when the keyboard opens:
          they are reassurance, and the field matters more. */}
      {!keyboardOpen && (
        <ul className="list-none m-0 p-0 mt-6 grid gap-3.5">
          {trustRows.map((row) => (
            <li
              key={row.text}
              className="flex items-center gap-3 text-[var(--pd-size-helper)] font-bold text-[var(--pd-navy)]"
            >
              <span
                className="flex-none grid place-items-center w-9 h-9 rounded-[11px] bg-[var(--pd-tint)] text-[var(--pd-blue-hover)]"
                aria-hidden="true"
              >
                {row.icon}
              </span>
              <span>{row.text}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="h-4" />
    </AuthShell>
  );
}
