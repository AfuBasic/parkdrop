import * as React from 'react';
import { X, Share, Plus, MoreVertical } from 'lucide-react';
import { Sheet, SheetContent } from '@/design-system';
import { cn } from '@/lib/utils';

export interface InstallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * How to put ParkDrop on the phone's home screen.
 *
 * Chrome on Android fires `beforeinstallprompt` and lets us open the real
 * install dialog, which is one tap. Everywhere else — notably iOS Safari,
 * which has no such API — we have to describe the steps, so the sheet shows
 * the right instructions for the browser the user is actually holding rather
 * than a generic list they have to work through.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Captures the install event as soon as the browser offers it. */
export function useInstallPrompt() {
  const [deferred, setDeferred] = React.useState<InstallPromptEvent | null>(null);

  React.useEffect(() => {
    const onPrompt = (event: Event) => {
      // Stop Chrome showing its own mini-infobar; we offer it on the Ready
      // screen instead, where it is in context.
      event.preventDefault();
      setDeferred(event as InstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = React.useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    await deferred.userChoice;
    // The event can only be used once.
    setDeferred(null);
    return true;
  }, [deferred]);

  return { canInstall: deferred !== null, install };
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallSheet({ open, onOpenChange }: InstallSheetProps) {
  const ios = isIos();

  const steps = ios
    ? [
        { icon: <Share className="w-[19px] h-[19px]" strokeWidth={2.5} />, text: 'Tap the Share button at the bottom of the screen.' },
        { icon: <Plus className="w-[19px] h-[19px]" strokeWidth={2.5} />, text: 'Choose "Add to Home Screen".' },
        { icon: null, text: 'Tap Add. ParkDrop will be on your phone screen.' },
      ]
    : [
        { icon: <MoreVertical className="w-[19px] h-[19px]" strokeWidth={2.5} />, text: 'Tap the three dots at the top right of your browser.' },
        { icon: <Plus className="w-[19px] h-[19px]" strokeWidth={2.5} />, text: 'Choose "Add to Home screen" or "Install app".' },
        { icon: null, text: 'Tap Add. ParkDrop will be on your phone screen.' },
      ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="w-full max-w-[420px] mx-auto p-5 pb-8 rounded-t-[var(--pd-sheet-radius)]"
      >
        <h2 className="m-0 mb-1 pr-10 text-[22px] font-extrabold tracking-[-0.02em] text-[var(--pd-navy)]">
          Put ParkDrop on your phone screen
        </h2>
        <p className="m-0 mb-5 text-[var(--pd-size-helper)] font-semibold text-[var(--pd-muted)]">
          So it opens in one tap, like any other app.
        </p>

        <ol className="list-none m-0 p-0 flex flex-col gap-3.5">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-3">
              <span
                className="flex-none grid place-items-center w-9 h-9 rounded-[11px] bg-[var(--pd-tint)] text-[var(--pd-blue-hover)] font-extrabold"
                aria-hidden="true"
              >
                {step.icon ?? index + 1}
              </span>
              <span className="text-[var(--pd-size-helper)] font-semibold text-[var(--pd-navy)] leading-[1.4]">
                {step.text}
              </span>
            </li>
          ))}
        </ol>

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
          Close
        </button>
      </SheetContent>
    </Sheet>
  );
}
