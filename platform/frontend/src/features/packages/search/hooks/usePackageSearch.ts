import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PackageSearchRepository } from '@/offline/repositories/package-search-repository';
import type { PackageSearchResult } from '../package-search-types';

interface UsePackageSearchProps {
  businessId: number;
  activePickupPointId?: number | null;
  query: string;
  debounceMs?: number;
}

interface UsePackageSearchResult {
  results: PackageSearchResult[];
  isLoading: boolean;
  debouncedQuery: string;
}

export function usePackageSearch({
  businessId,
  activePickupPointId,
  query,
  debounceMs = 120,
}: UsePackageSearchProps): UsePackageSearchResult {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceMs]);

  // Dexie useLiveQuery automatically updates when packages or customers tables change!
  const results = useLiveQuery(
    async () => {
      if (!businessId || !debouncedQuery.trim()) {
        return [];
      }
      return await PackageSearchRepository.search({
        businessId,
        activePickupPointId,
        query: debouncedQuery,
        limit: 20,
      });
    },
    [businessId, activePickupPointId, debouncedQuery],
    []
  );

  return {
    results: results ?? [],
    isLoading: results === undefined && Boolean(debouncedQuery.trim()),
    debouncedQuery,
  };
}
