import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/offline/db/database';

export interface RecentAmountChips {
  lastAmountMinor: number | null;
  frequentAmountsMinor: number[];
}

/**
 * Computes suggested quick amount chips from this pickup point's recent packages.
 * - "Last ₦X,XXX" (the most recent package's amount_due_minor)
 * - The up to two most frequent non-zero amounts in the last 30 days
 */
export function useRecentAmounts(
  businessId: number,
  pickupPointId: number | null
): RecentAmountChips {
  const result = useLiveQuery(async () => {
    if (!businessId) {
      return { lastAmountMinor: null, frequentAmountsMinor: [] };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const packages = await db.packages
      .where('business_id')
      .equals(businessId)
      .toArray();

    // Filter to this pickup point (or null) and last 30 days
    const relevant = packages
      .filter((p) => (pickupPointId === null || p.pickup_point_id === pickupPointId) && p.client_created_at >= thirtyDaysAgoIso)
      .sort((a, b) => b.client_created_at.localeCompare(a.client_created_at));

    if (relevant.length === 0) {
      return { lastAmountMinor: null, frequentAmountsMinor: [] };
    }

    const lastAmountMinor = relevant[0]?.amount_due_minor ?? null;

    // Count frequency of amounts > 0
    const freq = new Map<number, number>();
    for (const p of relevant) {
      const amt = p.amount_due_minor;
      if (amt > 0) {
        freq.set(amt, (freq.get(amt) || 0) + 1);
      }
    }

    // Sort by frequency descending, excluding lastAmountMinor if already shown
    const sortedFrequencies = Array.from(freq.entries())
      .filter(([amt]) => amt !== lastAmountMinor)
      .sort((a, b) => b[1] - a[1])
      .map(([amt]) => amt);

    const frequentAmountsMinor = sortedFrequencies.slice(0, 2);

    return {
      lastAmountMinor,
      frequentAmountsMinor,
    };
  }, [businessId, pickupPointId]);

  return result || { lastAmountMinor: null, frequentAmountsMinor: [] };
}
