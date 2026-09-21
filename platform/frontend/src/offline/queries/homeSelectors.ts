import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';
import type { LocalPackage } from '@/offline/db/schema';

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
          .filter(p => p.amount_due_minor > 0 && p.status !== 'CANCELLED')
          .count() 
      : 0,
    [businessId],
    0
  );
  return count ?? 0;
}

export function useCollectedTodayCount(businessId?: number): number {
  
  const count = useLiveQuery(
    () => businessId 
      ? db.packages.where('business_id').equals(businessId)
          .filter(p => p.status === 'COLLECTED' && false /* we don't have collected_at yet in this schema, so this is just a placeholder until Collection feature */)
          .count() 
      : 0,
    [businessId],
    0
  );
  return count ?? 0;
}

export type EnrichedPackage = LocalPackage & { customer_name: string; customer_phone: string };

export function useRecentPackages(businessId?: number, limit = 5): EnrichedPackage[] {
  const packages = useLiveQuery(
    async () => {
      if (!businessId) return [];
      const pkgs = await db.packages.where('business_id').equals(businessId)
          .reverse()
          .sortBy('client_created_at');
      const sliced = pkgs.reverse().slice(0, limit);
      
      return Promise.all(sliced.map(async (pkg) => {
        const customer = await db.customers.get(pkg.customer_id);
        return {
          ...pkg,
          customer_name: customer?.name || 'Unknown',
          customer_phone: customer?.phone_display || 'Unknown'
        };
      }));
    },
    [businessId, limit],
    []
  );
  return packages ?? [];
}
