import type { LocalCustomer } from '@/offline/db/schema';

export interface CustomerDirectoryItem {
  id: string; // canonical customer ID
  businessId: number;
  name: string;
  phoneDisplay: string;
  phoneNormalized: string;
  waitingPackageCount: number;
  totalPackageCount: number;
  mostRecentPackageAt: string | null;
  syncStatus: string;
}

export interface EnrichedCustomerPackage {
  id: string;
  publicPackageId: string;
  pickupCode: string;
  amountDueMinor: number;
  status: 'WAITING' | 'COLLECTED' | 'RETURNED' | 'CANCELLED';
  clientCreatedAt: string;
  pickupPointName?: string | null;
  pickupPointId: number | null;
  syncStatus: string;
}

export interface CustomerDetailRecord {
  customer: LocalCustomer;
  canonicalId: string;
  waitingPackages: EnrichedCustomerPackage[];
  recentPackages: EnrichedCustomerPackage[];
  waitingCount: number;
  totalCount: number;
}
