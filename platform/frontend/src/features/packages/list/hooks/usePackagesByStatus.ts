import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PackageRepository } from '@/offline/repositories/PackageRepository';
import type { PackageStatusFilter, PackageListRowItem } from '@/features/packages/list/package-list-types';

interface UsePackagesByStatusProps {
  businessId?: number;
  pickupPointId?: number | null;
  status: PackageStatusFilter;
  pageSize?: number;
}

interface UsePackagesByStatusResult {
  packages: PackageListRowItem[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export function usePackagesByStatus({
  businessId,
  pickupPointId = null,
  status,
  pageSize = 30,
}: UsePackagesByStatusProps): UsePackagesByStatusResult {
  const [limit, setLimit] = useState(pageSize);

  const packages = useLiveQuery(
    async () => {
      if (!businessId) return [];
      const list = await PackageRepository.listByStatus(businessId, pickupPointId, status, limit, 0);

      return list.map((pkg): PackageListRowItem => ({
        id: pkg.id,
        publicPackageId: pkg.public_package_id,
        pickupCode: pkg.pickup_code,
        customerId: pkg.customer_id,
        customerName: pkg.customer_name,
        customerPhone: pkg.customer_phone,
        amountDueMinor: pkg.amount_due_minor,
        status: pkg.status,
        clientCreatedAt: pkg.client_created_at,
        pickupPointId: pkg.pickup_point_id,
        syncStatus: pkg.sync_status,
      }));
    },
    [businessId, pickupPointId, status, limit],
    []
  );

  const loadMore = useCallback(() => {
    setLimit(prev => prev + pageSize);
  }, [pageSize]);

  const items = packages ?? [];
  const hasMore = items.length === limit;

  return {
    packages: items,
    isLoading: packages === undefined && Boolean(businessId),
    hasMore,
    loadMore,
  };
}
