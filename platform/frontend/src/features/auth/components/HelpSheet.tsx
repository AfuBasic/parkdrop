import { MessageCircle, Phone, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/design-system';
import { cn } from '@/lib/utils';
import { AuthStrings } from '../strings';
import { SUPPORT } from '../config';

export interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which screen the user is on, sent along so support has the context. */
  screenName?: string;
}

/**
 * The bottom sheet behind "Need help?".
 *
 * The promise is a person, not a help centre. Someone stuck on step 2 with no
 * code has already read the screen; another page of tips wastes the data they
 * are paying for. WhatsApp leads because it is the cheapest way for this
 * audience to reach anyone, and the message is pre-filled with the screen name
 * so they do not have to explain where they are.
 */
export function HelpSheet({ open, onOpenChange, screenName }: HelpSheetProps) {
  const context = screenName ? ` I am on the "${screenName}" screen.` : '';
  const whatsappUrl = `https://wa.me/${SUPPORT.whatsappNumber}?text=${encodeURIComponent(
    `Hello ParkDrop, I need help signing in.${context}`
  )}`;

  const actionClass = cn(
    'w-full min-h-[var(--pd-button-h)] px-5 rounded-[var(--pd-field-radius)]',
    'inline-flex items-center justify-center gap-2.5',
    'text-[var(--pd-size-button)] font-extrabold no-underline',
    'active:scale-[0.985] transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/35'
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="w-full max-w-[420px] mx-auto p-5 pb-8 rounded-t-[var(--pd-sheet-radius)]"
      >
        <div className="flex flex-col gap-2 mb-5 pr-10">
          <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] text-[var(--pd-navy)]">
            {AuthStrings.helpTitle}
          </h2>
          <p className="m-0 text-[var(--pd-size-helper)] font-semibold text-[var(--pd-muted)] leading-[1.45]">
            {AuthStrings.helpBody}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(actionClass, 'bg-[var(--pd-blue)] text-white hover:bg-[var(--pd-blue-hover)]')}
          >
            <MessageCircle className="w-[22px] h-[22px]" strokeWidth={2.5} aria-hidden="true" />
            {AuthStrings.helpWhatsApp}
          </a>

          <a
            href={`tel:${SUPPORT.phoneNumber}`}
            className={cn(
              actionClass,
              'bg-[var(--pd-tint)] text-[var(--pd-blue-hover)] border-2 border-[var(--pd-tint-2)] hover:bg-[var(--pd-tint-2)]'
            )}
          >
            <Phone className="w-[22px] h-[22px]" strokeWidth={2.5} aria-hidden="true" />
            {AuthStrings.helpCall}
          </a>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              'w-full min-h-[var(--pd-tap-min)] rounded-[var(--pd-field-radius)]',
              'inline-flex items-center justify-center gap-2',
              'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-muted)]',
              'hover:bg-[#F1F5F9] active:scale-[0.985]',
              'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
            )}
          >
            <X className="w-5 h-5" strokeWidth={2.75} aria-hidden="true" />
            {AuthStrings.helpClose}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
