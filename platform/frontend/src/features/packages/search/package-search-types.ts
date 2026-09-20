import type { LocalPackage } from '@/offline/db/schema';

export type QueryType = 
  | 'EMPTY'
  | 'PUBLIC_PACKAGE_ID'
  | 'PICKUP_CODE'
  | 'PHONE'
  | 'NAME_OR_TEXT';

export type MatchQuality =
  | 'EXACT_PICKUP_CODE'
  | 'EXACT_PUBLIC_ID'
  | 'EXACT_PHONE'
  | 'NAME_EXACT'
  | 'NAME_PREFIX'
  | 'NAME_TOKEN'
  | 'NAME_SUBSTRING'
  | 'PARTIAL_IDENTIFIER';

export interface PackageSearchResult {
  packageId: string;
  publicPackageId: string;
  pickupCode: string;
  customerId: string;
  customerName: string;
  phoneDisplay: string;
  phoneNormalized: string;
  amountDueMinor: number;
  status: LocalPackage['status'];
  clientCreatedAt: string;
  pickupPointId: number | null;
  pickupPointName?: string;
  syncStatus: LocalPackage['sync_status'];
  matchedBy: MatchQuality;
  score: number;
}

export interface PackageSearchOptions {
  businessId: number;
  activePickupPointId?: number | null;
  query: string;
  limit?: number;
}
