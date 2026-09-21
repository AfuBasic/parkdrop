import * as React from 'react';
import { ArrowLeft, Check, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { HeroArt } from './HeroArt';
import { ProgressBars } from './ProgressBars';
import { useKeyboardOpen } from '../lib/useKeyboardOpen';
import { AuthStrings } from '../strings';

export type HeaderSize = 'big' | 'medium' | 'compact';

export interface AuthShellProps {
  children: React.ReactNode;
  /** Pinned to the bottom of the sheet, above the keyboard. */
  foot?: React.ReactNode;
  size?: HeaderSize;
  onBack?: () => void;
  onHelp?: () => void;
  step?: number;
  totalSteps?: number;
  stepLabelOverride?: string;
  /** Show the white circle and green check, for the Ready screen. */
  success?: boolean;
  /** Circle with an initial, for the returning user. */
  avatarInitial?: string;
  showHero?: boolean;
}

/**
 * The frame every auth screen sits in: blue header, white sheet overlapping
 * it, and a foot that keeps the primary action in the same place every time.
 *
 * Two things this is deliberately careful about:
 *
 * 1. One left edge. The header content and the sheet content share the same
 *    20px gutter, so the logo lines up with the text below it. Previously the
 *    logo was pushed in to leave room for a back arrow that screen 1 does not
 *    have, which made it look accidentally indented.
 *
 * 2. The button is in the foot, outside the scrolling area. Putting it at the
 *    end of the content meant it floated mid-screen on a short page and sat
 *    under the keyboard on a real phone.
 */
export function AuthShell({
  children,
  foot,
  size = 'big',
  onBack,
  onHelp,
  step,
  totalSteps = 5,
  stepLabelOverride,
  success,
  avatarInitial,
  showHero = true,
}: AuthShellProps) {
  const keyboardOpen = useKeyboardOpen();
  // With the keyboard up there is no room for a hero or a tagline; everything
  // collapses to a single row so the field stays in view.
  const effectiveSize: HeaderSize = keyboardOpen ? 'compact' : size;

  const pill = cn(
    'inline-flex items-center gap-1.5 min-h-[var(--pd-tap-min)] px-3.5 rounded-full',
    'bg-white/20 text-white text-[var(--pd-size-chip)] font-extrabold',
    'hover:bg-white/30 active:scale-[0.97]',
    'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50'
  );

  return (
    // Fixed to the viewport height, not a minimum.
    //
    // With a minimum, tall content grows the frame and the whole page
    // scrolls — which quietly defeats the pinned foot, because the button
    // then sits below the fold exactly when the screen is shortest and the
    // keyboard is up. Pinning the frame to the viewport and letting only the
    // sheet's inner area scroll keeps the primary action on screen always.
    <div className="h-[100dvh] overflow-hidden bg-[var(--pd-page)] flex flex-col md:items-center md:justify-center md:py-8">
      <div
        className={cn(
          'relative w-full flex flex-col bg-[var(--pd-blue)] overflow-hidden',
          'h-full min-h-0',
          'md:h-[860px] md:max-h-full md:w-[400px] md:rounded-[44px] md:shadow-2xl'
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header
          className={cn(
            'relative flex-none text-white px-5 overflow-hidden dot-grid',
            'pt-[max(12px,env(safe-area-inset-top))]',
            'transition-[min-height,padding] duration-[var(--pd-motion-slow)]',
            effectiveSize === 'big' && 'min-h-[var(--pd-header-big)] pb-[46px]',
            effectiveSize === 'medium' && 'min-h-[var(--pd-header-mid)] pb-[46px]',
            effectiveSize === 'compact' && 'min-h-0 pb-[42px]'
          )}
        >
          {/* Top row. Everything starts at the same left edge as the sheet. */}
          <div className="relative z-10 flex items-center justify-between gap-2 min-h-[var(--pd-tap-min)]">
            {onBack ? (
              <button type="button" onClick={onBack} className={pill}>
                <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={3} aria-hidden="true" />
                {AuthStrings.back}
              </button>
            ) : (
              <Logo tone="blue" />
            )}

            {onHelp && (
              <button type="button" onClick={onHelp} className={pill}>
                <HelpCircle className="w-[18px] h-[18px]" strokeWidth={2.75} aria-hidden="true" />
                {AuthStrings.needHelp}
              </button>
            )}
          </div>

          {/* Tagline, screen 1 only. */}
          {effectiveSize === 'big' && (
            <p className="relative z-10 mt-3.5 mb-0 max-w-[62%] text-[clamp(21px,3vh,25px)] leading-[1.18] font-extrabold tracking-[-0.02em]">
              Record parcels.
              <br />
              Find them fast.
            </p>
          )}

          {/* Step counter on the middle screens. */}
          {step !== undefined && effectiveSize !== 'big' && (
            <ProgressBars
              step={step}
              total={totalSteps}
              compact={keyboardOpen}
              labelOverride={stepLabelOverride}
              className={keyboardOpen ? 'mt-3' : 'mt-4'}
            />
          )}

          {/* Success check, Ready screen. */}
          {success && !keyboardOpen && (
            <div className="absolute left-5 bottom-[52px] z-10 grid place-items-center w-[68px] h-[68px] rounded-full bg-white text-[var(--pd-ok)] pd-check-pop">
              <Check className="w-9 h-9" strokeWidth={3.5} aria-hidden="true" />
            </div>
          )}

          {/* Avatar, returning user. */}
          {avatarInitial && !keyboardOpen && (
            <div className="absolute left-5 bottom-[52px] z-10 grid place-items-center w-[68px] h-[68px] rounded-full bg-white text-[var(--pd-blue-hover)] text-[30px] font-extrabold">
              <span aria-hidden="true">{avatarInitial.toUpperCase()}</span>
            </div>
          )}

          {/* Parcels resting on the sheet edge. */}
          {showHero && !keyboardOpen && (effectiveSize === 'big' || effectiveSize === 'medium') && (
            <HeroArt className="absolute right-2 bottom-0 z-[1] h-[clamp(96px,19vh,150px)] w-auto aspect-[206/150]" />
          )}
        </header>

        {/* ── Sheet ──────────────────────────────────────────────────────── */}
        <div className="relative z-[3] flex-1 min-h-0 -mt-7 bg-white rounded-t-[var(--pd-sheet-radius)] flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-7">
            {children}
          </div>

          {/* The primary action lives here, never in the scroll area, so it is
              always in the thumb zone and always above the keyboard. */}
          {foot && (
            <div className="flex-none px-5 pt-4 pb-[max(18px,env(safe-area-inset-bottom))] bg-white">
              {foot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
