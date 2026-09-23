import { useLiveQuery } from 'dexie-react-hooks';
import { CustomerDirectoryRepository } from '../services/CustomerDirectoryRepository';
import type { CustomerDirectoryItem } from '../domain/customer-types';

interface UseCustomerDirectoryResult {
  items: CustomerDirectoryItem[];
  totalCount: number;
  isLoading: boolean;
}

export function useCustomerDirectory(
  businessId: number,
  query = '',
  limit = 50,
  offset = 0
): UseCustomerDirectoryResult {
  const result = useLiveQuery(
    async () => {
      if (!businessId) {
        return { items: [], totalCount: 0 };
      }
      return await CustomerDirectoryRepository.getDirectoryItems(businessId, query, limit, offset);
    },
    [businessId, query, limit, offset]
  );

  return {
    items: result?.items ?? [],
    totalCount: result?.totalCount ?? 0,
    isLoading: result === undefined,
  };
}
