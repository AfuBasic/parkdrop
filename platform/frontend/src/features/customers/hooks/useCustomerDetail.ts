import { useLiveQuery } from 'dexie-react-hooks';
import { CustomerDirectoryRepository } from '../services/CustomerDirectoryRepository';
import type { CustomerDetailRecord } from '../domain/customer-types';

interface UseCustomerDetailResult {
  data: CustomerDetailRecord | null;
  isLoading: boolean;
  notFound: boolean;
}

export function useCustomerDetail(
  businessId: number,
  customerIdOrAlias: string
): UseCustomerDetailResult {
  const data = useLiveQuery(
    async () => {
      if (!businessId || !customerIdOrAlias) {
        return null;
      }
      return await CustomerDirectoryRepository.getCustomerDetail(businessId, customerIdOrAlias);
    },
    [businessId, customerIdOrAlias]
  );

  return {
    data: data ?? null,
    isLoading: data === undefined,
    notFound: data === null,
  };
}
