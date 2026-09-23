import { useEffect } from 'react';
import { SyncEngine } from './sync-engine';

/**
 * Keeps this device's local changes moving to the server without the user
 * ever having to think about it.
 *
 * Before this existed, SyncEngine.sync() was only ever called as a side
 * effect of two unrelated screens (SMS credits, account security) — a
 * package added on Home had no path to the server at all unless the
 * attendant happened to visit one of those screens. This mounts once at the
 * app root and runs for as long as someone is signed in, reacting to:
 *   - immediate initial mount (and whenever businessId changes),
 *   - the instant the device comes back online,
 *   - the instant a local mutation is queued.
 *
 * (Note: Background continuous polling has been scoped down to specific screens
 * via usePollingSync where webhook live-updates are strictly needed.)
 */
export function useBackgroundSync(businessId: number | undefined): void {
  useEffect(() => {
    if (!businessId) return;

    const runSync = () => {
      if (navigator.onLine) {
        SyncEngine.sync(businessId).catch(() => {
          // SyncEngine's own push/pull paths log what went wrong;
          // background triggers just fire and forget.
        });
      }
    };

    // 1. Run immediately on mount
    runSync();

    // 2. Run immediately on reconnect
    const onOnline = () => {
      runSync();
    };

    // 3. Run immediately when a mutation is queued locally
    const onMutationQueued = (e: Event) => {
      const customEvent = e as CustomEvent<{ businessId: number }>;
      if (customEvent.detail.businessId === businessId) {
        runSync();
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('parkdrop:mutation-queued', onMutationQueued);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('parkdrop:mutation-queued', onMutationQueued);
    };
  }, [businessId]);
}
