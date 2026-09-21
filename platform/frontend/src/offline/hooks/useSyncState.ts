import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';
import { connectivityManager, type ConnectivityState } from '@/offline/sync/connectivity-manager';

export interface SyncUIState {
  connectivity: ConnectivityState;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: string | null;
  isSyncing: boolean;
}

export function useSyncState(businessId: number | undefined): SyncUIState {
  const [connectivity, setConnectivity] = useState<ConnectivityState>(
    connectivityManager.getState()
  );

  useEffect(() => {
    return connectivityManager.subscribe(setConnectivity);
  }, []);

  const pendingCount = useLiveQuery(
    () => businessId 
      ? db.mutations.where('business_id').equals(businessId).filter(m => m.status === 'PENDING' || m.status === 'RETRYABLE').count()
      : 0,
    [businessId],
    0
  );

  const syncingCount = useLiveQuery(
    () => businessId
      ? db.mutations.where('business_id').equals(businessId).filter(m => m.status === 'SYNCING').count()
      : 0,
    [businessId],
    0
  );

  const conflictCount = useLiveQuery(
    () => businessId
      ? db.conflicts.where('business_id').equals(businessId).filter(c => c.status === 'UNRESOLVED').count()
      : 0,
    [businessId],
    0
  );

  const syncState = useLiveQuery(
    () => businessId ? db.syncState.get(businessId) : undefined,
    [businessId]
  );

  return {
    connectivity,
    pendingCount: pendingCount ?? 0,
    conflictCount: conflictCount ?? 0,
    lastSyncedAt: syncState?.last_successful_sync_at ?? null,
    isSyncing: (syncingCount ?? 0) > 0,
  };
}
