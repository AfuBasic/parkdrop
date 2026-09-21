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

    // The tallest the viewport has been, standing in for "no keyboard".
    let baseline = viewport.height;

    /**
     * A keyboard is only plausible while something editable has focus.
     *
     * Height alone is not enough: resizing a desktop window, the browser's
     * own toolbars sliding in and out, and entering split screen all shrink
     * the viewport by well over the threshold without a keyboard existing.
     * Requiring a focused field as well removes those false positives, and
     * there is no case where a keyboard is up with nothing focused.
     */
    const editableFocused = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (el as HTMLElement).isContentEditable === true
      );
    };

    const measure = () => {
      if (viewport.height > baseline) baseline = viewport.height;

      if (!editableFocused()) {
        // Nothing focused, so whatever changed was not a keyboard — take the
        // current height as the new truth.
        baseline = viewport.height;
        setOpen(false);
        return;
      }

      setOpen(baseline - viewport.height > KEYBOARD_THRESHOLD_PX);
    };

    const reset = () => {
      baseline = viewport.height;
      setOpen(false);
    };

    viewport.addEventListener('resize', measure);
    viewport.addEventListener('scroll', measure);
    window.addEventListener('orientationchange', reset);
    // Blurring the field is the clearest signal the keyboard has gone.
    document.addEventListener('focusout', measure);
    document.addEventListener('focusin', measure);
    measure();

    return () => {
      viewport.removeEventListener('resize', measure);
      viewport.removeEventListener('scroll', measure);
      window.removeEventListener('orientationchange', reset);
      document.removeEventListener('focusout', measure);
      document.removeEventListener('focusin', measure);
    };
  }, []);

  return open;
}
