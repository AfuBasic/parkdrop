import type { LocalPackage, LocalPayment } from '@/offline/db/schema';
import { calculatePaymentSummary, type PaymentState } from '@/features/payments/domain/payment-summary';

export type StatusTab = 'WAITING' | 'COLLECTED' | 'OTHER';

export type WaitingFilterChip = '3d' | '7d';
export type CollectedFilterChip = 'today' | 'week' | 'owing';
export type OtherFilterChip = 'returned' | 'cancelled';

export type SortOrder = 'oldest' | 'newest' | 'amount';

export type AgeBand = 'TODAY_YESTERDAY' | 'THREE_TO_SIX' | 'SEVEN_PLUS';

export interface PackageFilterState {
  tab: StatusTab;
  waitingChips: Set<WaitingFilterChip>;
  collectedChips: Set<CollectedFilterChip>;
  otherChips: Set<OtherFilterChip>;
  sort: SortOrder;
  searchQuery: string;
}

export interface PackageCardData {
  pkg: LocalPackage;
  customerName?: string | null;
  customerPhone?: string | null;
  paymentState: PaymentState;
  amountDueMinor: number;
  balanceMinor: number;
  ageDays: number;
  ageBand: AgeBand;
  ageDisplay: string;
}

/**
 * Computes whether a package was received 24 hours or more ago.
 * Live computation relative to now, not a stored flag.
 */
export function isOverdue24h(createdIso: string, now: Date = new Date()): boolean {
  const createdTime = new Date(createdIso).getTime();
  const diffMs = now.getTime() - createdTime;
  return diffMs >= 24 * 60 * 60 * 1000;
}

/**
 * Returns subline naming the worst case: "Oldest waiting {N} days" or "{N} hours".
 */
export function formatOverdueAgeSubline(oldestCreatedIso: string, now: Date = new Date()): string {
  const createdTime = new Date(oldestCreatedIso).getTime();
  const diffMs = Math.max(0, now.getTime() - createdTime);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 48) {
    return `Oldest waiting ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `Oldest waiting ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
}

/**
 * Standard Lagos timezone offset is UTC+1.
 * Calculates exact age in integer days relative to current time in Africa/Lagos.
 */
export function calculateAgeDays(createdIso: string, now: Date = new Date()): number {
  const createdTime = new Date(createdIso).getTime();
  const diffMs = Math.max(0, now.getTime() - createdTime);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Classifies a package's age into the 3 canonical operational bands:
 * - 7+ days: critical attention (red)
 * - 3-6 days: aging (amber)
 * - 0-2 days: fresh (today / yesterday)
 */
export function getAgeBand(ageDays: number): AgeBand {
  if (ageDays >= 7) return 'SEVEN_PLUS';
  if (ageDays >= 3) return 'THREE_TO_SIX';
  return 'TODAY_YESTERDAY';
}

/**
 * Returns plain-English age representation: "Today", "Yesterday", "3 days", etc.
 */
export function formatAgeDisplay(createdIso: string, now: Date = new Date()): string {
  const date = new Date(createdIso);
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return 'Yesterday';

  const days = calculateAgeDays(createdIso, now);
  if (days <= 1) return 'Yesterday';
  return `${days} days`;
}

/**
 * Evaluates payment state for list row display:
 * - UNPAID: balance > 0 and no payments
 * - PART_PAID: balance > 0 and payments exist
 * - PAID: balance == 0 and amount > 0
 * - NOTHING_TO_PAY: amount == 0
 */
export function evaluatePackagePayment(amountDueMinor: number, payments: LocalPayment[] = []) {
  const summary = calculatePaymentSummary(amountDueMinor, payments);
  return {
    paymentState: summary.paymentState,
    balanceMinor: summary.balanceMinor,
    isFullyPaid: summary.isFullyPaid,
    isNothingToPay: safeMinor(amountDueMinor) === 0,
  };
}

function safeMinor(val: number): number {
  return Math.max(0, Math.floor(val || 0));
}

/**
 * Currency formatter for Nigerian Naira (en-NG, whole naira).
 */
export function formatNaira(minor: number): string {
  const naira = Math.round(safeMinor(minor) / 100);
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(naira);
}

/**
 * Filter matching logic for the Packages screen.
 */
export function matchesFilters(
  item: PackageCardData,
  tab: StatusTab,
  waitingChips: Set<WaitingFilterChip>,
  collectedChips: Set<CollectedFilterChip>,
  otherChips: Set<OtherFilterChip>,
  now: Date = new Date()
): boolean {
  // 1. Tab match
  if (tab === 'WAITING') {
    if (item.pkg.status !== 'WAITING') return false;

    // Waiting filter chips (3+ days, 7+ days)
    if (waitingChips.has('7d')) {
      if (item.ageDays < 7) return false;
    } else if (waitingChips.has('3d')) {
      if (item.ageDays < 3) return false;
    }
    return true;
  }

  if (tab === 'COLLECTED') {
    if (item.pkg.status !== 'COLLECTED') return false;

    // Collected filter chips (Today, This week, Owing)
    if (collectedChips.has('owing')) {
      if (item.balanceMinor <= 0) return false;
    }

    const createdTime = new Date(item.pkg.client_created_at).getTime();
    if (collectedChips.has('today')) {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      if (createdTime < startOfDay) return false;
    } else if (collectedChips.has('week')) {
      const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      if (createdTime < oneWeekAgo) return false;
    }
    return true;
  }

  if (tab === 'OTHER') {
    if (item.pkg.status !== 'RETURNED' && item.pkg.status !== 'CANCELLED') return false;

    // If a specific sub-filter is active:
    const wantsReturned = otherChips.has('returned');
    const wantsCancelled = otherChips.has('cancelled');

    if (wantsReturned && !wantsCancelled) {
      return item.pkg.status === 'RETURNED';
    }
    if (wantsCancelled && !wantsReturned) {
      return item.pkg.status === 'CANCELLED';
    }
    return true;
  }

  return true;
}

/**
 * Deterministic sorting comparator for packages:
 * - oldest: oldest client_created_at first
 * - newest: newest client_created_at first
 * - amount: highest balance / amount due first
 */
export function sortPackages(items: PackageCardData[], sort: SortOrder): PackageCardData[] {
  return [...items].sort((a, b) => {
    if (sort === 'oldest') {
      const timeA = new Date(a.pkg.client_created_at).getTime();
      const timeB = new Date(b.pkg.client_created_at).getTime();
      return timeA - timeB;
    }
    if (sort === 'newest') {
      const timeA = new Date(a.pkg.client_created_at).getTime();
      const timeB = new Date(b.pkg.client_created_at).getTime();
      return timeB - timeA;
    }
    if (sort === 'amount') {
      const amountA = a.balanceMinor > 0 ? a.balanceMinor : a.amountDueMinor;
      const amountB = b.balanceMinor > 0 ? b.balanceMinor : b.amountDueMinor;
      return amountB - amountA;
    }
    return 0;
  });
}
