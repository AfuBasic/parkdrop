import { useState, useEffect } from 'react';
import { Search, WifiOff } from 'lucide-react';
import { PackageStatusTabs } from './components/PackageStatusTabs';
import { PackageListRow } from './components/PackageListRow';
import { PackageListEmptyState } from './components/PackageListEmptyState';
import { usePackagesByStatus } from './hooks/usePackagesByStatus';
import { usePackageStatusCounts } from './hooks/usePackageStatusCounts';
import { useAuth } from '@/features/auth/AuthContext';
import { connectivityManager } from '@/offline/sync/connectivity-manager';
import type { PackageStatusFilter, PackageListRowItem } from './package-list-types';

interface PackagesScreenProps {
  initialStatus?: PackageStatusFilter;
  onNavigateToSearch?: () => void;
  onNavigateToAdd?: () => void;
  onSelectPackage?: (pkg: PackageListRowItem) => void;
}

export function PackagesScreen({
  initialStatus = 'WAITING',
  onNavigateToSearch,
  onNavigateToAdd,
  onSelectPackage,
}: PackagesScreenProps) {
  const { business } = useAuth();
  const businessId = business?.id || 0;
  const pickupPointId = null; // Scoped to active pickup point when point switcher is introduced

  const [activeStatus, setActiveStatus] = useState<PackageStatusFilter>(initialStatus);
  const [isOnline, setIsOnline] = useState(() => connectivityManager.getState() !== 'UNREACHABLE');

  useEffect(() => {
    return connectivityManager.subscribe((connState) => {
      setIsOnline(connState !== 'UNREACHABLE');
    });
  }, []);

  const counts = usePackageStatusCounts(businessId, pickupPointId);
  const { packages, hasMore, loadMore } = usePackagesByStatus({
    businessId,
    pickupPointId,
    status: activeStatus,
    pageSize: 30,
  });

  const handleSelect = (pkg: PackageListRowItem) => {
    if (onSelectPackage) {
      onSelectPackage(pkg);
    } else {
      // Temporary until Build 13 (Package Detail)
      alert(`Selected Package: ${pkg.publicPackageId} (${pkg.customerName})`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto pb-12">
      {/* App Header */}
      <header className="sticky top-0 z-20 bg-surface-page/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-border-subtle flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Packages
          </h1>

          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline</span>
            </div>
          )}
        </div>

        {/* Operational Search Entry Bar */}
        <div
          onClick={onNavigateToSearch}
          className="relative flex w-full items-center cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToSearch?.();
            }
          }}
          aria-label="Search packages"
        >
          <div className="absolute left-4 pointer-events-none flex items-center justify-center text-text-muted group-hover:text-text-primary transition-colors">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex h-12 w-full items-center rounded-xl border border-border-default bg-surface-default pl-12 pr-4 text-sm text-text-muted group-hover:border-border-strong group-hover:text-text-secondary transition-all shadow-sm">
            Search name, phone, pickup code or package ID
          </div>
        </div>
      </header>

      {/* Status Tabs with Exact Local Counts */}
      <PackageStatusTabs
        activeStatus={activeStatus}
        counts={counts}
        onSelectStatus={setActiveStatus}
      />

      {/* Packages Queue List / Empty State */}
      <main className="flex-1 px-4 pt-3" id={`panel-${activeStatus.toLowerCase()}`} role="tabpanel" aria-labelledby={`tab-${activeStatus.toLowerCase()}`}>
        {packages.length === 0 ? (
          <PackageListEmptyState
            status={activeStatus}
            onAddPackage={onNavigateToAdd}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col divide-y divide-border-subtle bg-surface-default rounded-2xl border border-border-subtle shadow-sm overflow-hidden" role="list">
              {packages.map((pkg) => (
                <PackageListRow
                  key={pkg.id}
                  pkg={pkg}
                  onSelect={handleSelect}
                />
              ))}
            </ul>

            {hasMore && (
              <div className="pt-2 pb-4 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  className="px-6 py-2.5 rounded-xl border border-border-default bg-surface-default hover:bg-surface-subtle text-text-primary font-semibold text-sm transition-colors cursor-pointer shadow-sm active:scale-98"
                >
                  Load more packages
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
