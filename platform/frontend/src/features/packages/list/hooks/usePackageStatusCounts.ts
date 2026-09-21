import { useLiveQuery } from 'dexie-react-hooks';
import { PackageRepository } from '@/offline/repositories/PackageRepository';
import type { StatusCounts } from '@/features/packages/list/package-list-types';

export function usePackageStatusCounts(
  businessId?: number,
  pickupPointId: number | null = null
): StatusCounts {
  const counts = useLiveQuery(
    async () => {
      if (!businessId) {
        return { WAITING: 0, COLLECTED: 0, RETURNED: 0, CANCELLED: 0 };
      }
      return await PackageRepository.countByStatus(businessId, pickupPointId);
    },
    [businessId, pickupPointId],
    { WAITING: 0, COLLECTED: 0, RETURNED: 0, CANCELLED: 0 }
  );

  return counts ?? { WAITING: 0, COLLECTED: 0, RETURNED: 0, CANCELLED: 0 };
}
