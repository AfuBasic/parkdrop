import type { LocalPackage } from '@/offline/db/schema';

export type PackageStatusFilter = 'WAITING' | 'COLLECTED' | 'RETURNED' | 'CANCELLED';

export type StatusCounts = Record<PackageStatusFilter, number>;

export interface PackageListRowItem {
  id: string;
  publicPackageId: string;
  pickupCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amountDueMinor: number;
  status: PackageStatusFilter;
  clientCreatedAt: string;
  pickupPointId: number | null;
  syncStatus: LocalPackage['sync_status'];
}
