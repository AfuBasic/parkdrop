import * as React from 'react';
import { Store, Smartphone } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { BigButton } from '../components/BigButton';
import { AuthStrings } from '../strings';
import { cn } from '@/lib/utils';

export interface ReadyScreenProps {
  firstName: string;
  pickupPointName: string;
  parkName: string;
  onStart: () => void;
  onEditPickupPoint?: () => void;
  onShowInstall?: () => void;
  onHelp: () => void;
}

/**
 * Screen 6. Setup is done.
 *
 * The summary card exists so the last thing they see is what they just
 * committed to — the names that will go out to their customers — with an
 * obvious way to fix a typo before any SMS is ever sent.
 */
export function ReadyScreen({
  firstName,
  pickupPointName,
  parkName,
  onStart,
  onEditPickupPoint,
  onShowInstall,
  onHelp,
}: ReadyScreenProps) {
  return (
    <AuthShell
      size="medium"
      success
      onHelp={onHelp}
      showHero={false}
      foot={<BigButton onClick={onStart}>{AuthStrings.readyPrimary}</BigButton>}
    >
      <h1 className="m-0 mb-2 text-[var(--pd-size-title)] font-extrabold leading-[1.15] tracking-[-0.025em] text-[var(--pd-navy)] text-balance">
        {AuthStrings.readyTitle(firstName)}
      </h1>
      <p className="m-0 text-[var(--pd-size-body)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
        {AuthStrings.readySubtitle}
      </p>

      {/* What they just set up, with a way to fix it. */}
      <div className="mt-6 p-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-line-2)] bg-white">
        <div className="flex items-start gap-3.5">
          <span
            className="flex-none grid place-items-center w-11 h-11 rounded-[13px] bg-[var(--pd-tint)] text-[var(--pd-blue-hover)]"
            aria-hidden="true"
          >
            <Store className="w-[22px] h-[22px]" strokeWidth={2.5} />
          </span>

          <div className="flex-1 min-w-0">
            <p className="m-0 text-[var(--pd-size-min)] font-bold text-[var(--pd-muted)]">
              {AuthStrings.readyPickupLabel}
            </p>
            <p className="m-0 mt-0.5 text-[var(--pd-size-body)] font-extrabold text-[var(--pd-navy)] break-words">
              {pickupPointName}
            </p>
            <p className="m-0 mt-0.5 text-[var(--pd-size-helper)] font-semibold text-[var(--pd-muted)] break-words">
              {parkName}
            </p>
          </div>

          {onEditPickupPoint && (
            <button
              type="button"
              onClick={onEditPickupPoint}
              className={cn(
                'flex-none inline-flex items-center min-h-[var(--pd-tap-min)] px-4 rounded-full',
                'border-2 border-[var(--pd-tint-2)] bg-[var(--pd-tint)]',
                'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-blue-hover)]',
                'hover:bg-[var(--pd-tint-2)] active:scale-[0.97]',
                'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
                'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
              )}
            >
              {AuthStrings.readyEdit}
            </button>
          )}
        </div>
      </div>

      {/* Installing matters more than it looks: on a cheap Android, opening a
          browser and typing a URL every time is what makes people stop using
          an app at all. */}
      {onShowInstall && (
        <div className="mt-4 p-4 rounded-[var(--pd-field-radius)] border-2 border-[var(--pd-tint-2)] bg-[var(--pd-tint)]">
          <div className="flex items-start gap-3.5">
            <span
              className="flex-none grid place-items-center w-11 h-11 rounded-[13px] bg-white text-[var(--pd-blue-hover)]"
              aria-hidden="true"
            >
              <Smartphone className="w-[22px] h-[22px]" strokeWidth={2.5} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="m-0 text-[var(--pd-size-helper)] font-extrabold text-[var(--pd-navy)]">
                {AuthStrings.installTitle}
              </p>
              <p className="m-0 mt-0.5 text-[var(--pd-size-min)] font-semibold text-[var(--pd-muted)]">
                {AuthStrings.installSubtitle}
              </p>
              <button
                type="button"
                onClick={onShowInstall}
                className={cn(
                  'inline-flex items-center mt-2 min-h-[var(--pd-tap-min)] px-4 rounded-full',
                  'bg-white border-2 border-[var(--pd-tint-2)]',
                  'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-blue-hover)]',
                  'active:scale-[0.97] transition-transform duration-[var(--pd-motion-fast)]',
                  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
                )}
              >
                {AuthStrings.installAction}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-4" />
    </AuthShell>
  );
}
