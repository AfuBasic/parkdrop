import { useState, useMemo, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertCircle, PackagePlus } from 'lucide-react';
import { db } from '@/offline/db/database';
import { useAuth } from '@/features/auth/AuthContext';
import { PackageSearchRepository } from '@/offline/repositories/package-search-repository';
import type { LocalCustomer, LocalPayment } from '@/offline/db/schema';
import { PackagesListHeader } from '@/features/packages/list/components/PackagesListHeader';
import { PackagesTabsAndChips } from '@/features/packages/list/components/PackagesTabsAndChips';
import { PackagesSortSheet } from '@/features/packages/list/components/PackagesSortSheet';
import { PackageListRow } from '@/features/packages/list/components/PackageListRow';
import { PackageListEmptyState } from '@/features/packages/list/components/PackageListEmptyState';
import { PackagesStrings } from '@/features/packages/strings';
import {
  type StatusTab,
  type WaitingFilterChip,
  type CollectedFilterChip,
  type OtherFilterChip,
  type SortOrder,
  type PackageCardData,
  calculateAgeDays,
  getAgeBand,
  formatAgeDisplay,
  evaluatePackagePayment,
  matchesFilters,
  sortPackages,
} from '@/features/packages/domain/package-filters';
import { accruedAmountDueMinor, DEFAULT_DAILY_STORAGE_FEE_MINOR } from '@/features/payments/domain/storage-fee';

export interface PackagesScreenProps {
  initialStatus?: StatusTab;
  initialPayFilter?: string;
  initialAgeFilter?: string;
  onNavigateToSearch?: () => void;
  onNavigateToAdd?: (phone?: string) => void;
  onSelectPackage?: (packageId: string) => void;
}

export function PackagesScreen({
  initialStatus = 'WAITING',
  initialPayFilter,
  initialAgeFilter,
  onNavigateToAdd,
  onSelectPackage,
}: PackagesScreenProps) {
  const routerNavigate = useNavigate();
  const handleNavigateToAdd = onNavigateToAdd ?? ((phone) => routerNavigate({ to: '/packages/new', search: phone ? { phone } : undefined }));
  const handleSelectPackage = onSelectPackage ?? ((id: string) => routerNavigate({ to: '/packages/$packageId', params: { packageId: id } }));

  const { business } = useAuth();
  const businessId = business?.id || 0;

  // Active status tab: WAITING, COLLECTED, OTHER
  const [activeTab, setActiveTab] = useState<StatusTab>(initialStatus);

  // Filter chips per tab
  const [waitingChips, setWaitingChips] = useState<Set<WaitingFilterChip>>(() => {
    const set = new Set<WaitingFilterChip>();
    if (initialPayFilter === 'unpaid') set.add('unpaid');
    if (initialAgeFilter === '3d') set.add('3d');
    if (initialAgeFilter === '7d') set.add('7d');
    return set;
  });

  const [collectedChips, setCollectedChips] = useState<Set<CollectedFilterChip>>(new Set());
  const [otherChips, setOtherChips] = useState<Set<OtherFilterChip>>(new Set());

  // Sort order: default 'oldest' for WAITING, 'newest' for others
  const [sortOrder, setSortOrder] = useState<SortOrder>(activeTab === 'WAITING' ? 'oldest' : 'newest');

  // Live search query (cross-tab)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagination limit (30 items at a time)
  const [renderLimit, setRenderLimit] = useState(30);

  // Debounce search query by ~150ms
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 150);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  };

  // Sync sort default when tab changes if user hasn't explicitly set it
  const handleTabChange = (tab: StatusTab) => {
    setActiveTab(tab);
    setSortOrder(tab === 'WAITING' ? 'oldest' : 'newest');
    setRenderLimit(30);
  };

  // Chip toggles
  const handleToggleWaitingChip = (chip: WaitingFilterChip) => {
    setWaitingChips((prev) => {
      const next = new Set(prev);
      if (chip === '3d') {
        next.delete('7d');
        if (next.has('3d')) next.delete('3d');
        else next.add('3d');
      } else if (chip === '7d') {
        next.delete('3d');
        if (next.has('7d')) next.delete('7d');
        else next.add('7d');
      } else {
        if (next.has(chip)) next.delete(chip);
        else next.add(chip);
      }
      return next;
    });
  };

  const handleToggleCollectedChip = (chip: CollectedFilterChip) => {
    setCollectedChips((prev) => {
      const next = new Set(prev);
      if (chip === 'today') {
        next.delete('week');
        if (next.has('today')) next.delete('today');
        else next.add('today');
      } else if (chip === 'week') {
        next.delete('today');
        if (next.has('week')) next.delete('week');
        else next.add('week');
      } else {
        if (next.has(chip)) next.delete(chip);
        else next.add(chip);
      }
      return next;
    });
  };

  const handleToggleOtherChip = (chip: OtherFilterChip) => {
    setOtherChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else {
        next.clear();
        next.add(chip);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setWaitingChips(new Set());
    setCollectedChips(new Set());
    setOtherChips(new Set());
  };

  const dailyStorageFeeMinor = business?.daily_storage_fee_minor ?? DEFAULT_DAILY_STORAGE_FEE_MINOR;

  // 1. Live Query for All Packages, Customers, and Payments for business
  const liveData = useLiveQuery(async () => {
    if (!businessId) return null;

    const [allPackages, allCustomers, allPayments] = await Promise.all([
      db.packages.where('business_id').equals(businessId).toArray(),
      db.customers.where('business_id').equals(businessId).toArray(),
      db.payments.where('business_id').equals(businessId).toArray(),
    ]);

    const customerMap = new Map<string, LocalCustomer>();
    allCustomers.forEach((c) => customerMap.set(c.id, c));

    const paymentsByPackageId = new Map<string, LocalPayment[]>();
    allPayments.forEach((p) => {
      const list = paymentsByPackageId.get(p.package_id) || [];
      list.push(p);
      paymentsByPackageId.set(p.package_id, list);
    });

    const now = new Date();
    const cardItems: PackageCardData[] = allPackages.map((pkg) => {
      const customer = customerMap.get(pkg.customer_id);
      const pkgPayments = paymentsByPackageId.get(pkg.id) || [];
      const effectiveAmountDueMinor = accruedAmountDueMinor(pkg, dailyStorageFeeMinor, now);
      const paymentEval = evaluatePackagePayment(effectiveAmountDueMinor, pkgPayments);
      const ageDays = calculateAgeDays(pkg.client_created_at, now);

      return {
        pkg,
        customerName: customer?.name || null,
        customerPhone: customer?.phone_display || customer?.phone_normalized || null,
        paymentState: paymentEval.paymentState,
        amountDueMinor: effectiveAmountDueMinor,
        balanceMinor: paymentEval.balanceMinor,
        ageDays,
        ageBand: getAgeBand(ageDays),
        ageDisplay: formatAgeDisplay(pkg.client_created_at, now),
      };
    });

    return cardItems;
  }, [businessId, dailyStorageFeeMinor]);

  // 2. Cross-tab search query using PackageSearchRepository
  const searchResults = useLiveQuery(async () => {
    if (!businessId || !debouncedQuery) return null;
    return await PackageSearchRepository.search({
      businessId,
      query: debouncedQuery,
      limit: 50,
    });
  }, [businessId, debouncedQuery]);

  const allItems = useMemo(() => liveData || [], [liveData]);

  // 3. Tab and Chip Counts Calculation
  const { waitingCounts, collectedCounts, otherCounts } = useMemo(() => {
    const w = { total: 0, unpaid: 0, age3d: 0, age7d: 0 };
    const c = { total: 0, today: 0, week: 0, owing: 0 };
    const o = { total: 0, returned: 0, cancelled: 0 };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    for (const item of allItems) {
      if (item.pkg.status === 'WAITING') {
        w.total++;
        if (item.balanceMinor > 0) w.unpaid++;
        if (item.ageDays >= 7) w.age7d++;
        else if (item.ageDays >= 3) w.age3d++;
      } else if (item.pkg.status === 'COLLECTED') {
        c.total++;
        if (item.balanceMinor > 0) c.owing++;
        const t = new Date(item.pkg.client_created_at).getTime();
        if (t >= startOfToday) c.today++;
        if (t >= oneWeekAgo) c.week++;
      } else if (item.pkg.status === 'RETURNED') {
        o.total++;
        o.returned++;
      } else if (item.pkg.status === 'CANCELLED') {
        o.total++;
        o.cancelled++;
      }
    }

    return { waitingCounts: w, collectedCounts: c, otherCounts: o };
  }, [allItems]);

  // 4. Filtered and Sorted Items for Active Tab (when not searching)
  const filteredAndSortedItems = useMemo(() => {
    const filtered = allItems.filter((item) =>
      matchesFilters(item, activeTab, waitingChips, collectedChips, otherChips)
    );
    return sortPackages(filtered, sortOrder);
  }, [allItems, activeTab, waitingChips, collectedChips, otherChips, sortOrder]);

  // Active filters count and summary text
  const { hasActiveFilters, filterSummaryText, isPositiveEmpty, positiveEmptyType } = useMemo(() => {
    const parts: string[] = [];
    let positiveEmpty = false;
    let emptyType: 'unpaid' | '7d' | undefined;

    if (activeTab === 'WAITING') {
      if (waitingChips.has('unpaid')) parts.push(PackagesStrings.chipUnpaid);
      if (waitingChips.has('7d')) parts.push(PackagesStrings.chipAge7d);
      else if (waitingChips.has('3d')) parts.push(PackagesStrings.chipAge3d);

      if (filteredAndSortedItems.length === 0 && allItems.some((i) => i.pkg.status === 'WAITING')) {
        if (waitingChips.has('unpaid') && !waitingChips.has('7d') && !waitingChips.has('3d')) {
          positiveEmpty = true;
          emptyType = 'unpaid';
        } else if (waitingChips.has('7d') && !waitingChips.has('unpaid')) {
          positiveEmpty = true;
          emptyType = '7d';
        }
      }
    } else if (activeTab === 'COLLECTED') {
      if (collectedChips.has('today')) parts.push(PackagesStrings.chipToday);
      else if (collectedChips.has('week')) parts.push(PackagesStrings.chipThisWeek);
      if (collectedChips.has('owing')) parts.push(PackagesStrings.chipOwing);
    } else if (activeTab === 'OTHER') {
      if (otherChips.has('returned')) parts.push(PackagesStrings.chipReturned);
      else if (otherChips.has('cancelled')) parts.push(PackagesStrings.chipCancelled);
    }

    const hasFilters = parts.length > 0;
    const summary = hasFilters
      ? `${parts.join(', ')}: ${filteredAndSortedItems.length} ${
          filteredAndSortedItems.length === 1 ? 'package' : 'packages'
        }`
      : null;

    return {
      hasActiveFilters: hasFilters,
      filterSummaryText: summary,
      isPositiveEmpty: positiveEmpty,
      positiveEmptyType: emptyType,
    };
  }, [activeTab, waitingChips, collectedChips, otherChips, filteredAndSortedItems.length, allItems]);

  // 5. Grouping Calculation
  const groupedItems = useMemo(() => {
    const sliced = filteredAndSortedItems.slice(0, renderLimit);

    if (activeTab === 'WAITING' && sortOrder === 'oldest') {
      const g7Plus: PackageCardData[] = [];
      const g3To6: PackageCardData[] = [];
      const gFresh: PackageCardData[] = [];

      for (const item of sliced) {
        if (item.ageBand === 'SEVEN_PLUS') g7Plus.push(item);
        else if (item.ageBand === 'THREE_TO_SIX') g3To6.push(item);
        else gFresh.push(item);
      }

      const groups: Array<{ id: string; label: string; count: number; items: PackageCardData[]; tone: 'bad' | 'warn' | 'neutral' }> = [];
      if (g7Plus.length > 0) groups.push({ id: '7plus', label: PackagesStrings.group7DaysOrMore, count: g7Plus.length, items: g7Plus, tone: 'bad' });
      if (g3To6.length > 0) groups.push({ id: '3to6', label: PackagesStrings.group3To6Days, count: g3To6.length, items: g3To6, tone: 'warn' });
      if (gFresh.length > 0) groups.push({ id: 'fresh', label: PackagesStrings.groupTodayAndYesterday, count: gFresh.length, items: gFresh, tone: 'neutral' });

      return { type: 'age-bands' as const, groups };
    }

    // Default chronological grouping by day
    const map = new Map<string, PackageCardData[]>();
    for (const item of sliced) {
      const d = formatAgeDisplay(item.pkg.client_created_at);
      const list = map.get(d) || [];
      list.push(item);
      map.set(d, list);
    }

    const groups = Array.from(map.entries()).map(([label, items]) => ({
      id: label,
      label,
      count: items.length,
      items,
      tone: 'neutral' as const,
    }));

    return { type: 'days' as const, groups };
  }, [filteredAndSortedItems, activeTab, sortOrder, renderLimit]);

  const isSearching = searchQuery.trim().length > 0;
  const isSearchLoading = isSearching && searchResults === undefined;
  const hasSearchResults = (searchResults?.length ?? 0) > 0;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--pd-page)] max-w-lg mx-auto pb-16">
      {/* 1. Header with Live Cross-Tab Search Input */}
      <PackagesListHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
      />



      {/* 2. When NOT searching: Show 3 Tabs + Filter Chips + Summary/Sort Bar */}
      {!isSearching && (
        <>
          <PackagesTabsAndChips
            activeTab={activeTab}
            onSelectTab={handleTabChange}
            waitingCounts={waitingCounts}
            collectedCounts={collectedCounts}
            otherCounts={otherCounts}
            waitingChips={waitingChips}
            onToggleWaitingChip={handleToggleWaitingChip}
            collectedChips={collectedChips}
            onToggleCollectedChip={handleToggleCollectedChip}
            otherChips={otherChips}
            onToggleOtherChip={handleToggleOtherChip}
          />

          <PackagesSortSheet
            currentSort={sortOrder}
            onSelectSort={setSortOrder}
            filterSummaryText={filterSummaryText}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </>
      )}

      {/* 3. Main Body */}
      <main className="flex-1 px-4 py-3 flex flex-col gap-3">
        {/* State A: Cross-Tab Search Active */}
        {isSearching ? (
          <div>
            {isSearchLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-[var(--pd-muted)] gap-2">
                <div className="w-6 h-6 border-2 border-[var(--pd-blue)] border-t-transparent rounded-full animate-spin" />
                <span className="text-[15px] font-bold">Searching all packages…</span>
              </div>
            ) : !hasSearchResults ? (
              <div className="py-10 px-4 text-center flex flex-col items-center gap-3 bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] shadow-xs">
                <AlertCircle className="w-10 h-10 text-[var(--pd-muted)]" />
                <div>
                  <h3 className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0">
                    {PackagesStrings.noSearchResultsTitle}
                  </h3>
                  <p className="text-[15px] font-bold text-[var(--pd-muted)] mt-1 mb-0">
                    {PackagesStrings.noSearchResultsBody}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = searchQuery.replace(/\D/g, '');
                    handleNavigateToAdd(cleanPhone.length >= 7 ? cleanPhone : undefined);
                  }}
                  className="mt-2 min-h-[48px] px-5 py-2.5 rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] text-white text-[16px] font-extrabold flex items-center gap-2 shadow-xs hover:bg-[var(--pd-blue-hover)] active:scale-95 transition-transform"
                >
                  <PackagePlus className="w-5 h-5" />
                  <span>{PackagesStrings.addPackageAction}</span>
                </button>
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5 p-0 m-0" role="list">
                {searchResults!.map((result) => {
                  const item = allItems.find((i) => i.pkg.id === result.packageId);
                  if (!item) return null;
                  return (
                    <PackageListRow
                      key={result.packageId}
                      data={item}
                      onSelect={(id) => onSelectPackage?.(id)}
                      showStatusBadge
                    />
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          /* State B: Regular Filtered / Grouped List */
          <div>
            {filteredAndSortedItems.length === 0 ? (
              <PackageListEmptyState
                isPositiveFilterEmpty={isPositiveEmpty}
                filterType={positiveEmptyType}
                onClearFilters={handleClearFilters}
                onAddPackage={() => handleNavigateToAdd()}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {groupedItems.groups.map((group) => (
                  <div key={group.id} className="flex flex-col gap-2">
                    {/* Sticky Section Header */}
                    <div className="sticky top-[108px] z-10 py-1 px-1 bg-[var(--pd-page)]/95 backdrop-blur-xs flex items-center justify-between text-[15px] font-extrabold text-[var(--pd-navy)]">
                      <div className="flex items-center gap-1.5">
                        {group.tone === 'bad' && <span className="w-2.5 h-2.5 rounded-full bg-[var(--pd-bad)]" />}
                        {group.tone === 'warn' && <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />}
                        <span>{group.label}</span>
                      </div>
                      <span className="text-[15px] text-[var(--pd-muted)] font-bold tabular-nums">
                        {group.count}
                      </span>
                    </div>

                    {/* Group Items */}
                    <ul className="flex flex-col gap-2.5 p-0 m-0" role="list">
                      {group.items.map((item) => (
                        <PackageListRow
                          key={item.pkg.id}
                          data={item}
                          onSelect={(id) => handleSelectPackage(id)}
                          showStatusBadge={activeTab !== 'WAITING'}
                        />
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Show 30 More Button if items exceed limit */}
                {filteredAndSortedItems.length > renderLimit && (
                  <div className="py-3 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setRenderLimit((prev) => prev + 30)}
                      className="min-h-[48px] px-6 py-2.5 rounded-[var(--pd-field-radius)] bg-white border border-[var(--pd-line)] text-[var(--pd-navy)] font-extrabold text-[15px] hover:border-[var(--pd-blue)] active:scale-98 shadow-xs"
                    >
                      {PackagesStrings.showMorePackages}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
