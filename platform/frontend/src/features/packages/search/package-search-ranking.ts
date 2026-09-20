import type { MatchQuality, PackageSearchResult } from './package-search-types';
import type { LocalPackage } from '@/offline/db/schema';

// Centralized score rules
export const SEARCH_SCORES: Record<MatchQuality, number> = {
  EXACT_PICKUP_CODE: 1000,
  EXACT_PUBLIC_ID: 950,
  EXACT_PHONE: 900,
  NAME_EXACT: 800,
  NAME_PREFIX: 700,
  NAME_TOKEN: 600,
  NAME_SUBSTRING: 500,
  PARTIAL_IDENTIFIER: 400,
};

const STATUS_BOOST: Record<LocalPackage['status'], number> = {
  WAITING: 30,
  COLLECTED: 15,
  RETURNED: 5,
  CANCELLED: 0,
};

const ACTIVE_PICKUP_POINT_BOOST = 20;

/**
 * Calculates a match score for a package candidate.
 */
export function calculateScore(
  matchedBy: MatchQuality,
  status: LocalPackage['status'],
  packagePickupPointId: number | null,
  activePickupPointId?: number | null
): number {
  let score = SEARCH_SCORES[matchedBy];

  // Secondary relevance: status
  score += STATUS_BOOST[status] ?? 0;

  // Pickup point relevance: active location prioritized
  if (
    activePickupPointId !== undefined &&
    activePickupPointId !== null &&
    packagePickupPointId === activePickupPointId
  ) {
    score += ACTIVE_PICKUP_POINT_BOOST;
  }

  return score;
}

/**
 * Deterministic sorting comparator for PackageSearchResult items:
 * 1. Higher score first
 * 2. If scores equal, WAITING packages first
 * 3. If statuses equal, most recent (clientCreatedAt desc)
 * 4. Stable tie-breaker by packageId
 */
export function compareSearchResults(a: PackageSearchResult, b: PackageSearchResult): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }

  // Status priority check
  const aStatusRank = STATUS_BOOST[a.status] ?? 0;
  const bStatusRank = STATUS_BOOST[b.status] ?? 0;
  if (bStatusRank !== aStatusRank) {
    return bStatusRank - aStatusRank;
  }

  // Recency check (clientCreatedAt descending)
  const aTime = new Date(a.clientCreatedAt).getTime();
  const bTime = new Date(b.clientCreatedAt).getTime();
  if (bTime !== aTime) {
    return bTime - aTime;
  }

  // Final tie-breaker
  return a.packageId.localeCompare(b.packageId);
}
