import * as React from 'react';
import { X, MessageSquare, ShoppingCart, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/design-system/components/Sheet';

export interface LowCreditBannerProps {
  balance: number;
  onBuyCredits?: () => void;
  onDismiss?: () => void;
  /** When true, the × dismiss button is hidden */
  noDismiss?: boolean;
  className?: string;
}

/**
 * Shown when SMS credits are 0 or critically low (< 5).
 *
 * Variants:
 *  - zero:  red-tinted "error" tone — customers are not being texted right now.
 *  - low:   amber "warning" tone  — running out soon.
 *
 * Props:
 *  - onBuyCredits  → optional CTA handler (hidden when not provided).
 *  - onDismiss     → optional dismiss handler (shows × button when provided,
 *                    unless noDismiss is true).
 *  - noDismiss     → override to hide the × even when onDismiss is given.
 */
export function LowCreditBanner({
  balance,
  onBuyCredits,
  onDismiss,
  noDismiss = false,
  className,
}: LowCreditBannerProps) {
  const [learnMoreOpen, setLearnMoreOpen] = React.useState(false);
  const isZero = balance === 0;

  const bg = isZero ? 'bg-[var(--pd-bad-bg)] border-[var(--pd-bad)]/25' : 'bg-[var(--pd-warn-bg)] border-[#FDE68A]';
  const iconColor = isZero ? 'text-[var(--pd-bad)]' : 'text-[var(--pd-warn)]';
  const textColor = isZero ? 'text-[var(--pd-bad)]' : 'text-[var(--pd-warn-dark,#92400E)]';
  const title = isZero
    ? 'No SMS credits left'
    : `Only ${balance} SMS credit${balance === 1 ? '' : 's'} left`;
  const subtitle = isZero
    ? 'Customers are not being texted when their packages arrive.'
    : 'Running low — customers may stop receiving arrival texts soon.';

  return (
    <>
      <div
        role="alert"
        className={cn(
          'rounded-[var(--pd-card-radius)] border px-4 py-3 flex flex-col gap-2',
          bg,
          className
        )}
      >
        {/* Row 1: icon + title + dismiss */}
        <div className="flex items-start gap-3">
          <MessageSquare
            className={cn('w-5 h-5 flex-none mt-0.5', iconColor)}
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className={cn('text-[15px] font-extrabold m-0 leading-snug', textColor)}>
              {title}
            </p>
            <p className={cn('text-[13px] font-semibold m-0 mt-0.5 leading-snug', textColor, 'opacity-80')}>
              {subtitle}
            </p>
          </div>

          {!noDismiss && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss SMS credit warning"
              className={cn(
                'flex-none w-8 h-8 rounded-full flex items-center justify-center',
                '-mt-0.5 -mr-1',
                'hover:bg-black/10 active:scale-95 transition-all',
                textColor
              )}
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Row 2: action buttons */}
        <div className="flex items-center gap-3 pl-8">
          {onBuyCredits && (
            <button
              type="button"
              onClick={onBuyCredits}
              className={cn(
                'inline-flex items-center gap-1.5 text-[13px] font-extrabold',
                'h-8 px-3 rounded-lg border-2',
                isZero
                  ? 'border-[var(--pd-bad)] text-[var(--pd-bad)] hover:bg-[var(--pd-bad)]/10'
                  : 'border-[var(--pd-warn-dark,#92400E)] text-[var(--pd-warn-dark,#92400E)] hover:bg-[var(--pd-warn-dark,#92400E)]/10',
                'active:scale-95 transition-all'
              )}
            >
              <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2.5} />
              Buy credits
            </button>
          )}

          <button
            type="button"
            onClick={() => setLearnMoreOpen(true)}
            className={cn(
              'inline-flex items-center gap-1 text-[13px] font-semibold',
              'h-8 px-1',
              textColor,
              'opacity-75 hover:opacity-100 transition-opacity underline underline-offset-2'
            )}
          >
            <Info className="w-3.5 h-3.5" strokeWidth={2} />
            Learn more
          </button>
        </div>
      </div>

      {/* Learn More Sheet */}
      <Sheet open={learnMoreOpen} onOpenChange={setLearnMoreOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle className="text-left text-[20px]">
              What happens when credits run out?
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5 mt-4 pb-2">
            {/* Reassurance block */}
            <div className="rounded-[var(--pd-card-radius)] bg-[var(--pd-ok-bg)] border border-[#BBF7D0] px-4 py-3">
              <p className="text-[15px] font-extrabold text-[var(--pd-ok)] m-0">
                Your app keeps working — nothing stops.
              </p>
              <p className="text-[14px] font-semibold text-[var(--pd-ok)] opacity-80 m-0 mt-1 leading-relaxed">
                You can still add packages, mark collections, track payments, and run reports exactly as normal.
              </p>
            </div>

            {/* What does stop */}
            <div>
              <p className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--pd-muted)] m-0 mb-3">
                The only thing that stops
              </p>
              <div className="flex items-start gap-3 rounded-[var(--pd-card-radius)] bg-white border border-[var(--pd-line-2)] px-4 py-3">
                <MessageSquare
                  className="w-5 h-5 flex-none mt-0.5 text-[var(--pd-muted)]"
                  strokeWidth={2.25}
                />
                <div>
                  <p className="text-[15px] font-bold text-[var(--pd-navy)] m-0">
                    Arrival text messages
                  </p>
                  <p className="text-[14px] font-semibold text-[var(--pd-muted)] m-0 mt-0.5 leading-relaxed">
                    When credits hit zero, customers no longer receive an SMS when their parcel arrives.
                    You can still notify them manually — via WhatsApp from the package screen.
                  </p>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 flex-none mt-0.5 text-[var(--pd-blue)]" strokeWidth={2} />
              <p className="text-[13px] font-semibold text-[var(--pd-muted)] m-0 leading-relaxed">
                Tip: SMS credits are shared across your whole team. Top up any time and the balance is immediately available to everyone.
              </p>
            </div>

            {onBuyCredits && (
              <button
                type="button"
                onClick={() => {
                  setLearnMoreOpen(false);
                  onBuyCredits();
                }}
                className="w-full min-h-[52px] rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] text-white text-[17px] font-extrabold active:scale-[0.98] transition-transform"
              >
                Buy SMS credits
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
