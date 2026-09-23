import * as React from 'react';

/** Below this, a spinner would flash and read as a glitch. */
const SPINNER_AFTER_MS = 400;
/** Long enough that silence starts to feel like a dead app. */
const REASSURE_AFTER_MS = 8_000;
/** Past this we stop pretending and offer a retry. */
const TIMEOUT_AFTER_MS = 15_000;

export type RequestPhase = 'idle' | 'quiet' | 'waiting' | 'slow' | 'timeout';

export interface SlowRequest {
  phase: RequestPhase;
  /** True while a request is in flight, whatever the phase. */
  busy: boolean;
  /** Show a spinner and the waiting words. */
  showSpinner: boolean;
  /** Tell them the network is slow but we have not given up. */
  showReassurance: boolean;
  /** Give up and offer Try again. */
  timedOut: boolean;
  start: () => void;
  finish: () => void;
  reset: () => void;
}

/**
 * Tracks how long a request has been running, so the screen can say something
 * honest at each stage.
 *
 * On slow data the difference between "nothing is happening" and "this is
 * taking a while but it is still going" is the difference between someone
 * waiting and someone tapping the button five more times. The 400ms floor
 * keeps a fast response from flashing a spinner, which reads as a glitch.
 */
export function useSlowRequest(): SlowRequest {
  const [phase, setPhase] = React.useState<RequestPhase>('idle');
  const timers = React.useRef<number[]>([]);

  const clearTimers = React.useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const start = React.useCallback(() => {
    clearTimers();
    setPhase('quiet');

    timers.current.push(
      window.setTimeout(() => setPhase('waiting'), SPINNER_AFTER_MS),
      window.setTimeout(() => setPhase('slow'), REASSURE_AFTER_MS),
      window.setTimeout(() => setPhase('timeout'), TIMEOUT_AFTER_MS)
    );
  }, [clearTimers]);

  const finish = React.useCallback(() => {
    clearTimers();
    setPhase('idle');
  }, [clearTimers]);

  const reset = finish;

  React.useEffect(() => clearTimers, [clearTimers]);

  return {
    phase,
    busy: phase === 'quiet' || phase === 'waiting' || phase === 'slow',
    showSpinner: phase === 'waiting' || phase === 'slow',
    showReassurance: phase === 'slow',
    timedOut: phase === 'timeout',
    start,
    finish,
    reset,
  };
}
