/**
 * Retry Policy for ParkDrop
 *
 * Provides exponential backoff with jitter for sync engine and connectivity probes.
 * All retry timing is configurable; production values are conservative to avoid
 * thundering-herd effects when many devices reconnect simultaneously.
 *
 * JITTER: ±20% random variation on each computed backoff interval prevents
 * synchronized retry spikes from multiple devices on the same network.
 */

const JITTER_FACTOR = 0.2; // ±20%

/**
 * Compute backoff duration in milliseconds for a given attempt number.
 *
 * Uses truncated exponential backoff with jitter:
 *   backoff = min(baseMs * 2^attempt, maxMs) × jitter
 *
 * @param attempt  - 0-indexed attempt number (0 = first retry after initial failure)
 * @param baseMs   - base interval in milliseconds
 * @param maxMs    - maximum interval cap in milliseconds
 * @returns        - backoff duration in milliseconds
 */
export function computeBackoff(attempt: number, baseMs: number, maxMs: number): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxMs);
  const jitter = 1 + (Math.random() * 2 - 1) * JITTER_FACTOR; // 0.8–1.2
  return Math.round(capped * jitter);
}

export interface RetryPolicy {
  /** Delay in ms for the first retry */
  baseDelayMs: number;
  /** Maximum delay in ms regardless of attempt count */
  maxDelayMs: number;
  /** Maximum number of retry attempts before giving up */
  maxAttempts: number;
}

/**
 * Sync engine retry policy.
 * After network recovery, devices should not all retry within the same second.
 * Cap at 30s so manual re-tries still feel responsive.
 */
export const SYNC_RETRY_POLICY: RetryPolicy = {
  baseDelayMs: 1_000,   // 1s base
  maxDelayMs: 30_000,   // cap at 30s
  maxAttempts: 10,      // give up after 10 consecutive sync failures
};

/**
 * Connectivity probe retry policy.
 * Shorter intervals; we want to detect recovery quickly.
 */
export const CONNECTIVITY_PROBE_POLICY: RetryPolicy = {
  baseDelayMs: 500,
  maxDelayMs: 10_000,
  maxAttempts: 20,
};

/**
 * Stateful backoff tracker for a single retry sequence.
 *
 * Usage:
 *   const tracker = createBackoffTracker(SYNC_RETRY_POLICY);
 *   tracker.recordFailure();
 *   await delay(tracker.nextDelayMs());
 *   tracker.recordSuccess(); // resets
 */
export interface BackoffTracker {
  recordFailure(): void;
  recordSuccess(): void;
  nextDelayMs(): number;
  consecutiveFailures(): number;
  hasExhausted(): boolean;
}

export function createBackoffTracker(policy: RetryPolicy): BackoffTracker {
  let failures = 0;

  return {
    recordFailure() {
      if (failures < policy.maxAttempts) {
        failures++;
      }
    },

    recordSuccess() {
      failures = 0;
    },

    nextDelayMs() {
      if (failures === 0) return 0;
      return computeBackoff(failures - 1, policy.baseDelayMs, policy.maxDelayMs);
    },

    consecutiveFailures() {
      return failures;
    },

    hasExhausted() {
      return failures >= policy.maxAttempts;
    },
  };
}
