import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { LocalPackage } from '../db/schema';

export function useWaitingCount(businessId?: number): number {
  const count = useLiveQuery(
    () => businessId ? db.packages.where('[business_id+status]').equals([businessId, 'WAITING']).count() : 0,
    [businessId],
    0
  );
  return count ?? 0;
}

export function useUnpaidCount(businessId?: number): number {
  const count = useLiveQuery(
    () => businessId 
      ? db.packages.where('business_id').equals(businessId)
          .filter(p => p.amount_due > 0 && p.status !== 'CANCELLED')
          .count() 
      : 0,
    [businessId],
    0
  );
  return count ?? 0;
}

export function useCollectedTodayCount(businessId?: number): number {
  const today = new Date().toISOString().split('T')[0];
  
  const count = useLiveQuery(
    () => businessId 
      ? db.packages.where('business_id').equals(businessId)
          .filter(p => p.status === 'COLLECTED' && p.collected_at !== null && p.collected_at.startsWith(today))
          .count() 
      : 0,
    [businessId],
    0
  );
  return count ?? 0;
}

export function useRecentPackages(businessId?: number, limit = 5): LocalPackage[] {
  const packages = useLiveQuery(
    () => businessId
      ? db.packages.where('business_id').equals(businessId)
          .reverse()
          .sortBy('created_at')
          .then(list => list.slice(0, limit))
      : [],
    [businessId, limit],
    []
  );
  return packages ?? [];
}
