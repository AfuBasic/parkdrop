import { useEffect } from 'react';
import { SyncEngine } from './sync-engine';

const BASE_INTERVAL_MS = 15_000;

/**
 * Keeps this device's local changes moving to the server without the user
 * ever having to think about it.
 *
 * Before this existed, SyncEngine.sync() was only ever called as a side
 * effect of two unrelated screens (SMS credits, account security) — a
 * package added on Home had no path to the server at all unless the
 * attendant happened to visit one of those screens. This mounts once at the
 * app root and runs for as long as someone is signed in, regardless of
 * which screen they are on:
 *   - once immediately on mount (and whenever businessId changes),
 *   - again the instant the device comes back online,
 *   - and on a steady interval while online, backing off automatically
 *     when SyncEngine's own backoff tracker reports repeated failures,
 *     so a down server is not hammered every 15s.
 *
 * SyncEngine.sync() is already safe to call this often: it no-ops while a
 * sync is in flight, and returns immediately if the device is unreachable.
 */
export function useBackgroundSync(businessId: number | undefined): void {
  useEffect(() => {
    if (!businessId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const runAndReschedule = () => {
      if (cancelled) return;

      const attempt = navigator.onLine
        ? SyncEngine.sync(businessId).catch(() => {
            // SyncEngine's own push/pull paths already log what went wrong;
            // a background loop's job is just to not crash on it and to
            // try again, slower, via the shared backoff tracker below.
          })
        : Promise.resolve();

      attempt.finally(() => {
        if (cancelled) return;
        const delay = Math.max(BASE_INTERVAL_MS, SyncEngine.backoffTracker.nextDelayMs());
        timer = setTimeout(runAndReschedule, delay);
      });
    };

    runAndReschedule();

    const onOnline = () => {
      if (timer) clearTimeout(timer);
      runAndReschedule();
    };
    window.addEventListener('online', onOnline);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', onOnline);
    };
  }, [businessId]);
}
