import * as React from 'react';

/** Shrink beyond this many pixels and we treat the keyboard as open. */
const KEYBOARD_THRESHOLD_PX = 140;

/**
 * True while the on-screen keyboard is covering a meaningful part of the page.
 *
 * Measured from visualViewport rather than guessed from focus events: a focus
 * event tells you a field was tapped, not whether a keyboard actually appeared
 * (it does not on a desktop, or with a hardware keyboard attached, or when the
 * user dismisses it and keeps the field focused).
 *
 * The screens use this to collapse the blue header and drop the trust rows, so
 * the field being typed into and the primary button both stay on screen. On a
 * 640px-tall phone the keyboard takes roughly half the screen, so without this
 * the button sits underneath it.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    // The tallest the viewport has been, which stands in for "no keyboard".
    // Read lazily so rotation re-establishes the baseline.
    let baseline = viewport.height;

    const measure = () => {
      if (viewport.height > baseline) baseline = viewport.height;
      setOpen(baseline - viewport.height > KEYBOARD_THRESHOLD_PX);
    };

    const handleOrientation = () => {
      baseline = viewport.height;
      setOpen(false);
    };

    viewport.addEventListener('resize', measure);
    viewport.addEventListener('scroll', measure);
    window.addEventListener('orientationchange', handleOrientation);
    measure();

    return () => {
      viewport.removeEventListener('resize', measure);
      viewport.removeEventListener('scroll', measure);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  return open;
}
