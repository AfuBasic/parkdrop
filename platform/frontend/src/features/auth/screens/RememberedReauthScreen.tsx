import { Store } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { BigButton } from '../components/BigButton';
import { Notice } from '../components/Notice';
import { AuthStrings } from '../strings';
import { AUTH_IDENTIFIER } from '../config';
import { formatNationalDisplay } from '../lib/phone';
import type { RememberedIdentity } from '@/lib/db';
import { cn } from '@/lib/utils';

export interface RememberedReauthScreenProps {
  identity: RememberedIdentity;
  onContinue: (identifier: string) => void;
  onSwitchAccount: () => void;
  onHelp: () => void;
  busy?: boolean;
  error?: string;
  slowNetwork?: boolean;
}

/**
 * Shown when we still know who this is but the session has run out.
 *
 * They do not need to type their phone or email again — we already have it —
 * so the screen is one tap plus a way out if the name shown is not theirs.
 */
export function RememberedReauthScreen({
  identity,
  onContinue,
  onSwitchAccount,
  onHelp,
  busy,
  error,
  slowNetwork,
}: RememberedReauthScreenProps) {
  const name = identity.name || '';
  const isPhone = AUTH_IDENTIFIER === 'phone';
  const shownIdentifier = isPhone ? formatNationalDisplay(identity.email) : identity.email;

  return (
    <AuthShell
      size="medium"
      avatarInitial={name.charAt(0) || '?'}
      onHelp={onHelp}
      showHero={false}
      foot={
        <div className="flex flex-col gap-3">
          <BigButton
            onClick={() => onContinue(identity.email)}
            busy={busy}
            busyLabel={AuthStrings.sendingCode}
          >
            {AuthStrings.continue}
          </BigButton>

          <button
            type="button"
            onClick={onSwitchAccount}
            className={cn(
              'w-full min-h-[var(--pd-tap-min)] rounded-full',
              'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-blue-hover)]',
              'hover:bg-[var(--pd-tint)] active:scale-[0.98]',
              'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
            )}
          >
            {AuthStrings.notYou}
          </button>
        </div>
      }
    >
      <h1 className="m-0 mb-2 text-[var(--pd-size-title)] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--pd-navy)] text-balance">
        {name ? AuthStrings.welcomeBack(name) : 'Welcome back'}
      </h1>
      <p className="m-0 text-[var(--pd-size-body)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
        {AuthStrings.reauthSubtitle(AUTH_IDENTIFIER)}
      </p>

      <div className="mt-6 p-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line-2)] bg-white">
        <div className="flex items-start gap-3.5">
          <span
            className="flex-none grid place-items-center w-11 h-11 rounded-[13px] bg-[var(--pd-tint)] text-[var(--pd-blue-hover)]"
            aria-hidden="true"
          >
            <Store className="w-[22px] h-[22px]" strokeWidth={2.5} />
          </span>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'm-0 text-[var(--pd-size-body)] font-extrabold text-[var(--pd-navy)] break-all',
                isPhone && 'pd-nums'
              )}
            >
              {shownIdentifier}
            </p>
            {identity.business_name && (
              <p className="m-0 mt-0.5 text-[var(--pd-size-helper)] font-semibold text-[var(--pd-muted)] break-words">
                {identity.business_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Notice tone="error" className="mt-4">
          {error}
        </Notice>
      )}

      {slowNetwork && (
        <Notice tone="info" className="mt-4">
          {AuthStrings.slowNetwork}
        </Notice>
      )}

      <div className="h-4" />
    </AuthShell>
  );
}
