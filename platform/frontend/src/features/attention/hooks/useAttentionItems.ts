import { useLiveQuery } from 'dexie-react-hooks';
import { AttentionRepository, type AttentionFilterOptions } from '@/offline/read-models/attention-repository';
import type { AttentionItem } from '@/features/attention/attention-types';

export function useAttentionItems(options: AttentionFilterOptions): {
  items: AttentionItem[];
  isLoading: boolean;
  unresolvedCount: number;
} {
  const { businessId, userRole, activePurchase } = options;

  const items = useLiveQuery(
    async () => {
      if (!businessId) return [];
      return await AttentionRepository.getAttentionItems({
        businessId,
        userRole,
        activePurchase,
      });
    },
    [businessId, userRole, activePurchase?.id, activePurchase?.status],
    []
  );

  const isLoading = items === undefined;
  const unresolvedList = items || [];

  return {
    items: unresolvedList,
    isLoading,
    unresolvedCount: unresolvedList.length,
  };
}
