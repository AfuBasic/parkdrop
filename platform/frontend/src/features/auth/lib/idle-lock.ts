/**
 * PIN re-lock is now gated on idle time rather than firing on every reload.
 * Reloading mid-shift (which happens constantly on a kiosk-style device)
 * was forcing the PIN screen every time, even seconds after the last tap —
 * that's not a real security boundary being crossed, just noise. A device
 * that's gone quiet for a while is the actual signal worth locking on.
 */
const LAST_ACTIVITY_KEY = 'parkdrop_last_activity_at';
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// Activity events fire far more often than the lock decision needs — this
// caps how often we actually touch localStorage.
const ACTIVITY_WRITE_THROTTLE_MS = 10 * 1000;
let lastWriteAt = 0;

export function recordActivity(): void {
  const now = Date.now();
  if (now - lastWriteAt < ACTIVITY_WRITE_THROTTLE_MS) return;
  lastWriteAt = now;
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  } catch {
    // Storage can be unavailable (private mode, quota); losing the idle
    // marker just means the next reload re-locks, which is the safe default.
  }
}

export function isWithinIdleWindow(): boolean {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return false;
    const lastActivityAt = Number(raw);
    if (!Number.isFinite(lastActivityAt)) return false;
    return Date.now() - lastActivityAt < IDLE_TIMEOUT_MS;
  } catch {
    return false;
  }
}

export function clearActivity(): void {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Nothing to do — worst case the stale marker is harmless since
    // isWithinIdleWindow() will naturally age it out.
  }
}
