import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';

/**
 * Stale-while-revalidate for data that isn't already backed by its own
 * synced Dexie table (Reports' range metrics, for example — most other
 * screens already read live from Dexie, which SyncEngine keeps fresh in the
 * background, so they don't need this).
 *
 * The contract (see the SMS Credits "false zero" bug this generalizes the
 * fix for): a value that hasn't been confirmed must never render as if it
 * had been. `value` is `undefined` only when there is truly nothing to show
 * yet — no cache, no successful fetch. Once a value exists, it is never
 * cleared again just because a later refresh failed; `isError` says the
 * background refresh failed while `value` keeps showing the last known-good
 * answer.
 */
export interface CachedFetchState<T> {
  /** undefined = nothing known yet (true first load, no cache). Show a skeleton. */
  value: T | undefined;
  /** When `value` was last confirmed from a successful fetch. */
  fetchedAt: string | undefined;
  /** True while a fetch is in flight — including a background refresh behind a cached value. */
  isRefreshing: boolean;
  /** The most recent fetch attempt failed. `value` (if any) is still the last known-good answer. */
  isError: boolean;
  refetch: () => void;
}

export function useCachedFetch<T>(
  key: string | null | undefined,
  fetcher: () => Promise<T>
): CachedFetchState<T> {
  const cached = useLiveQuery(
    () => (key ? db.queryCache.get(key) : undefined),
    [key]
  );

  const [liveValue, setLiveValue] = useState<T | undefined>(undefined);
  const [liveFetchedAt, setLiveFetchedAt] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);

  // Avoids a stale closure writing results for a key the caller has since
  // moved away from (e.g. switching report presets while a fetch is in flight).
  const requestKeyRef = useRef<string | null | undefined>(key);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const runFetch = useCallback(() => {
    if (!key) return;
    requestKeyRef.current = key;
    setIsRefreshing(true);
    setIsError(false);

    fetcherRef.current()
      .then(async (result) => {
        if (requestKeyRef.current !== key) return;
        const fetchedAt = new Date().toISOString();
        setLiveValue(result);
        setLiveFetchedAt(fetchedAt);
        setIsRefreshing(false);
        await db.queryCache.put({ key, value: result, fetched_at: fetchedAt });
      })
      .catch(() => {
        if (requestKeyRef.current !== key) return;
        // Deliberately not clearing liveValue/cached here — a failed refresh
        // must keep showing the last known-good value, not blank the screen
        // or fall back to a skeleton.
        setIsError(true);
        setIsRefreshing(false);
      });
  }, [key]);

  useEffect(() => {
    setLiveValue(undefined);
    setLiveFetchedAt(undefined);
    setIsError(false);
    runFetch();
  }, [key, runFetch]);

  const resolvedValue = liveValue !== undefined ? liveValue : (cached?.value as T | undefined);
  const resolvedFetchedAt = liveValue !== undefined ? liveFetchedAt : cached?.fetched_at;

  return {
    value: resolvedValue,
    fetchedAt: resolvedFetchedAt,
    isRefreshing,
    isError,
    refetch: runFetch,
  };
}
