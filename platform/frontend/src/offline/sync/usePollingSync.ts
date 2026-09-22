import { useEffect } from 'react';
import { SyncEngine } from './sync-engine';
import { useAuth } from '@/features/auth/AuthContext';

/**
 * Actively polls the server for changes at the specified interval.
 * Used only on specific screens that require live updates (like waiting for
 * an SMS webhook status to change) where the normal event-driven sync isn't enough.
 */
export function usePollingSync(intervalMs = 15_000): void {
  const { business } = useAuth();
  const businessId = business?.id;

  useEffect(() => {
    if (!businessId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const runAndReschedule = () => {
      if (cancelled) return;

      const attempt = navigator.onLine
        ? SyncEngine.sync(businessId).catch(() => {
            // SyncEngine's own push/pull paths log what went wrong
          })
        : Promise.resolve();

      attempt.finally(() => {
        if (cancelled) return;
        // Use the requested interval, but respect SyncEngine's backoff if it's failing
        const delay = Math.max(intervalMs, SyncEngine.backoffTracker.nextDelayMs());
        timer = setTimeout(runAndReschedule, delay);
      });
    };

    runAndReschedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [businessId, intervalMs]);
}
