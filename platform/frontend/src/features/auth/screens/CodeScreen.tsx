import * as React from 'react';
import { Loader2, MessageCircle, Phone, RotateCw, Mail } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { CodeField } from '../components/CodeField';
import { BigButton } from '../components/BigButton';
import { Notice } from '../components/Notice';
import { AuthStrings } from '../strings';
import {
  AUTH_IDENTIFIER,
  AUTH_FALLBACK_CHANNELS,
  RESEND_COOLDOWN_SECONDS,
  type IdentifierMode,
} from '../config';
import { formatNationalDisplay } from '../lib/phone';
import { webmailProviderFor } from '../lib/webmail';
import { cn } from '@/lib/utils';

export interface CodeScreenProps {
  /** The phone or email the code went to. */
  identifier: string;
  mode?: IdentifierMode;
  onVerify: (code: string) => void;
  onResend: () => void;
  onChangeIdentifier: () => void;
  onBack: () => void;
  onHelp: () => void;
  busy?: boolean;
  error?: string;
  step?: number;
  totalSteps?: number;
  stepLabelOverride?: string;
  slowNetwork?: boolean;
  timedOut?: boolean;
  onWhatsAppCode?: () => void;
  onCallCode?: () => void;
}

/**
 * Screen 2. Where most sign-ups are lost, so most of the work here is about
 * what happens when the code does not turn up.
 */
export function CodeScreen({
  identifier,
  mode = AUTH_IDENTIFIER,
  onVerify,
  onResend,
  onChangeIdentifier,
  onBack,
  onHelp,
  busy,
  error,
  step = 2,
  totalSteps = 5,
  stepLabelOverride,
  slowNetwork,
  timedOut,
  onWhatsAppCode,
  onCallCode,
}: CodeScreenProps) {
  const [code, setCode] = React.useState('');
  const [localError, setLocalError] = React.useState('');
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_COOLDOWN_SECONDS);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isPhone = mode === 'phone';
  const shownError = error || localError;
  const webmail = isPhone ? null : webmailProviderFor(identifier);
  // A retry button only earns a place once there is something to retry: the
  // request timed out, or the last code came back wrong. Otherwise the 6th
  // digit submits on its own and a button here would just sit there unused.
  const needsManualRetry = timedOut || !!shownError;

  // Clear the boxes when the server rejects the code, so the next attempt
  // starts from empty rather than making them delete six digits by hand.
  React.useEffect(() => {
    if (error) {
      setCode('');
      navigator.vibrate?.(60);
      inputRef.current?.focus();
    }
  }, [error]);

  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const handleComplete = (value: string) => {
    setLocalError('');
    onVerify(value);
  };

  const submit = () => {
    if (busy) return;
    if (code.length < 6) {
      setLocalError(AuthStrings.codeShort(mode));
      inputRef.current?.focus();
      navigator.vibrate?.(30);
      return;
    }
    setLocalError('');
    onVerify(code);
  };

  const resend = () => {
    if (secondsLeft > 0 || busy) return;
    setCode('');
    setLocalError('');
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    onResend();
    inputRef.current?.focus();
  };

  const displayIdentifier = isPhone ? formatNationalDisplay(identifier) : identifier;

  const canResend = secondsLeft <= 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (secondsLeft / RESEND_COOLDOWN_SECONDS) * circumference;

  const secondaryButton = cn(
    'w-full min-h-[var(--pd-tap-min)] px-4 rounded-[var(--pd-field-radius)]',
    'inline-flex items-center justify-center gap-2',
    'border-2 border-[var(--pd-tint-2)] bg-[var(--pd-tint)]',
    'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-blue-hover)]',
    'hover:bg-[var(--pd-tint-2)] active:scale-[0.98]',
    'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
  );

  const showWhatsApp = isPhone && AUTH_FALLBACK_CHANNELS.whatsapp && onWhatsAppCode;
  const showCall = isPhone && AUTH_FALLBACK_CHANNELS.voiceCall && onCallCode;

  return (
    <AuthShell
      size="compact"
      onBack={onBack}
      onHelp={onHelp}
      step={step}
      totalSteps={totalSteps}
      stepLabelOverride={stepLabelOverride}
      // The 6th digit submits on its own, so a button pinned here for every
      // half-filled attempt is dead weight sitting next to the resend card.
      // It only earns its place back when there is something to retry.
      foot={
        needsManualRetry ? (
          <BigButton onClick={submit} busy={busy} busyLabel={AuthStrings.checking}>
            {timedOut ? AuthStrings.tryAgain : AuthStrings.continue}
          </BigButton>
        ) : undefined
      }
    >
      <h1 className="m-0 mb-2 text-[var(--pd-size-title)] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--pd-navy)]">
        {AuthStrings.codeTitle}
      </h1>

      <p className="m-0 text-[var(--pd-size-body)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
        {AuthStrings.codeSentTo(mode)}
      </p>

      {/* The identifier and the way to correct it sit on one row, so "Change"
          cannot wrap into the middle of the sentence the way it used to. */}
      <div className="flex items-center gap-2.5 flex-wrap mt-2">
        <span
          className={cn(
            'font-extrabold text-[var(--pd-navy)] text-[var(--pd-size-body)] min-w-0 break-all',
            isPhone && 'pd-nums'
          )}
        >
          {displayIdentifier}
        </span>
        <button
          type="button"
          onClick={onChangeIdentifier}
          className={cn(
            'flex-none inline-flex items-center min-h-[var(--pd-tap-min)] px-4 rounded-full',
            'border-2 border-[var(--pd-tint-2)] bg-[var(--pd-tint)]',
            'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-blue-hover)]',
            'hover:bg-[var(--pd-tint-2)] active:scale-[0.97]',
            'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
          )}
        >
          {AuthStrings.codeChange}
        </button>
      </div>

      <div className="mt-6">
        <CodeField
          value={code}
          onChange={setCode}
          onComplete={handleComplete}
          error={!!shownError}
          disabled={busy}
          autoFocus
          label={AuthStrings.codeLabel}
          inputRef={inputRef}
        />
      </div>

      {busy && !shownError && (
        <p
          role="status"
          className="m-0 mt-3 flex items-center gap-2 text-[var(--pd-size-helper)] font-extrabold text-[var(--pd-blue-hover)]"
        >
          <Loader2 className="w-[18px] h-[18px] animate-spin" strokeWidth={3} aria-hidden="true" />
          {AuthStrings.checking}
        </p>
      )}

      {shownError && (
        <Notice tone="error" plain className="mt-3">
          {shownError}
        </Notice>
      )}

      {slowNetwork && !timedOut && (
        <Notice tone="info" className="mt-3">
          {AuthStrings.slowNetwork}
        </Notice>
      )}

      {timedOut && (
        <Notice tone="error" className="mt-3">
          {AuthStrings.tookTooLong}
        </Notice>
      )}

      {/* Sets the expectation before they start worrying. */}
      <p className="m-0 mt-3 text-[var(--pd-size-helper)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
        {AuthStrings.codeHint(mode)}
      </p>

      {webmail && (
        <a
          href={webmail.url}
          target="_blank"
          rel="noreferrer"
          className={cn(secondaryButton, 'mt-3 no-underline')}
        >
          <Mail className="w-[19px] h-[19px]" strokeWidth={2.5} aria-hidden="true" />
          {webmail.label}
        </a>
      )}

      {/* Resend card */}
      <div
        className={cn(
          'flex items-center gap-3.5 mt-5 p-3.5 rounded-[var(--pd-field-radius)]',
          'border-2 border-[var(--pd-line-2)] bg-[#F8FAFC]'
        )}
      >
        {!canResend && (
          <svg className="w-11 h-11 flex-none -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r={radius} className="fill-none stroke-[var(--pd-line-2)] stroke-[4px]" />
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="fill-none stroke-[var(--pd-blue)] stroke-[4px] transition-[stroke-dashoffset] duration-1000 ease-linear"
              style={{ strokeDasharray: circumference, strokeDashoffset: progress }}
            />
          </svg>
        )}

        <div className="flex-1 min-w-0">
          <p className="m-0 text-[var(--pd-size-helper)] font-extrabold text-[var(--pd-navy)]">
            {canResend ? AuthStrings.resendReadyTitle : AuthStrings.resendTitle}
          </p>
          {!canResend && (
            <p className="m-0 mt-0.5 text-[var(--pd-size-min)] font-semibold text-[var(--pd-muted)]">
              <span className="pd-nums">{AuthStrings.resendWait(secondsLeft)}</span>
            </p>
          )}
        </div>

        {canResend && (
          <button
            type="button"
            onClick={resend}
            className={cn(
              'flex-none inline-flex items-center gap-1.5 min-h-[var(--pd-tap-min)] px-4 rounded-full',
              'bg-[var(--pd-blue)] text-white text-[var(--pd-size-chip)] font-extrabold',
              'hover:bg-[var(--pd-blue-hover)] active:scale-[0.97]',
              'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/35'
            )}
          >
            <RotateCw className="w-[17px] h-[17px]" strokeWidth={3} aria-hidden="true" />
            {AuthStrings.resendButton}
          </button>
        )}
      </div>

      {/* Other ways to get the code. Only channels that actually work are
          shown — a dead button here is worse than no button. */}
      {(showWhatsApp || showCall) && (
        <div className="mt-5">
          <p className="m-0 mb-2.5 text-[var(--pd-size-helper)] font-extrabold text-[var(--pd-navy)]">
            {AuthStrings.stillNoCode}
          </p>
          <div className="flex flex-col gap-2.5">
            {showWhatsApp && (
              <button type="button" onClick={onWhatsAppCode} className={secondaryButton}>
                <MessageCircle className="w-[19px] h-[19px]" strokeWidth={2.5} aria-hidden="true" />
                {AuthStrings.codeOnWhatsApp}
              </button>
            )}
            {showCall && (
              <button type="button" onClick={onCallCode} className={secondaryButton}>
                <Phone className="w-[19px] h-[19px]" strokeWidth={2.5} aria-hidden="true" />
                {AuthStrings.codeByCall}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="h-4" />
    </AuthShell>
  );
}
