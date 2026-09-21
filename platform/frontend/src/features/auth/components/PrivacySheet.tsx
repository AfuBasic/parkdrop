import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@/design-system';
import { cn } from '@/lib/utils';
import { AuthStrings } from '../strings';

export interface PrivacySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The Privacy Notice, shown over the sign-in flow.
 *
 * It is a sheet rather than a page for the same reason the help sheet is:
 * the notice sits under a half-finished form, and sending someone to
 * /privacy.html on the marketing site walks them out of the app entirely —
 * off a page that is not part of this bundle, and back through a full
 * download to return. A sheet closes and leaves everything they typed
 * exactly where it was.
 */
export function PrivacySheet({ open, onOpenChange }: PrivacySheetProps) {
  const sectionTitleClass =
    'm-0 mt-6 mb-2 text-[var(--pd-size-helper)] font-extrabold text-[var(--pd-navy)]';
  const bodyClass =
    'm-0 text-[var(--pd-size-helper)] font-semibold text-[var(--pd-muted)] leading-[1.45]';
  const listClass = 'list-disc m-0 mt-2 pl-5 grid gap-1.5';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          'w-full max-w-[420px] mx-auto p-5 pb-8 rounded-t-[var(--pd-sheet-radius)]',
          // The notice is longer than the help sheet, so it scrolls inside
          // itself rather than growing past the top of a small screen.
          'max-h-[85vh] overflow-y-auto'
        )}
      >
        <div className="flex flex-col gap-2 mb-1 pr-10">
          <h2 className="m-0 text-[22px] font-extrabold tracking-[-0.02em] text-[var(--pd-navy)]">
            {AuthStrings.privacyTitle}
          </h2>
          <p className={bodyClass}>{AuthStrings.privacyIntro}</p>
        </div>

        <h3 className={sectionTitleClass}>{AuthStrings.privacyRecordedTitle}</h3>
        <p className={bodyClass}>{AuthStrings.privacyRecordedIntro}</p>
        <ul className={cn(listClass, bodyClass)}>
          {AuthStrings.privacyRecordedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className={sectionTitleClass}>{AuthStrings.privacyUseTitle}</h3>
        <p className={bodyClass}>{AuthStrings.privacyUseIntro}</p>
        <ul className={cn(listClass, bodyClass)}>
          {AuthStrings.privacyUseItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className={sectionTitleClass}>{AuthStrings.privacyContactTitle}</h3>
        <p className={bodyClass}>{AuthStrings.privacyContactBody}</p>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className={cn(
            'w-full mt-6 min-h-[var(--pd-tap-min)] rounded-[var(--pd-field-radius)]',
            'inline-flex items-center justify-center gap-2',
            'text-[var(--pd-size-chip)] font-extrabold text-[var(--pd-muted)]',
            'hover:bg-[#F1F5F9] active:scale-[0.985]',
            'transition-[transform,background-color] duration-[var(--pd-motion-fast)]',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pd-blue)]/30'
          )}
        >
          <X className="w-5 h-5" strokeWidth={2.75} aria-hidden="true" />
          {AuthStrings.privacyClose}
        </button>
      </SheetContent>
    </Sheet>
  );
}
