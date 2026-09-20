import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Package, Search, WifiOff } from 'lucide-react';
import { PackageSearchInput } from './components/PackageSearchInput';
import { PackageSearchResults } from './components/PackageSearchResults';
import { usePackageSearch } from './hooks/usePackageSearch';
import { useAuth } from '@/features/auth/AuthContext';
import { connectivityManager } from '@/offline/sync/connectivity-manager';
import type { PackageSearchResult } from './package-search-types';

interface PackageSearchScreenProps {
  onBack?: () => void;
  onSelectPackage?: (result: PackageSearchResult) => void;
  initialQuery?: string;
}

export function PackageSearchScreen({
  onBack,
  onSelectPackage,
  initialQuery = '',
}: PackageSearchScreenProps) {
  const { business } = useAuth();
  const businessId = business?.id || 0;
  const activePickupPointId = null; // Can be wired to active pickup point when multi-point selection is added

  const [query, setQuery] = useState(initialQuery);
  const [isOnline, setIsOnline] = useState(() => {
    return connectivityManager.getState() !== 'UNREACHABLE';
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Connectivity listener
  useEffect(() => {
    return connectivityManager.subscribe((connState) => {
      setIsOnline(connState !== 'UNREACHABLE');
    });
  }, []);

  // Autofocus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { results, isLoading, debouncedQuery } = usePackageSearch({
    businessId,
    activePickupPointId,
    query,
    debounceMs: 100,
  });

  const hasQuery = Boolean(query.trim());
  const hasResults = results.length > 0;
  const showNoResults = hasQuery && !isLoading && !hasResults && debouncedQuery.trim().length >= 2;

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleSelect = (result: PackageSearchResult) => {
    if (onSelectPackage) {
      onSelectPackage(result);
    } else {
      // Temporary until Build 13 (Package Detail)
      alert(`Selected Package: ${result.publicPackageId} (${result.customerName})`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-page max-w-lg mx-auto pb-8">
      {/* Sticky Header with Back action & Search field */}
      <header className="sticky top-0 z-20 bg-surface-page/95 backdrop-blur-md px-4 pt-3 pb-3 border-b border-border-subtle flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary active:scale-95 transition-all cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Find package
            </h1>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline</span>
            </div>
          )}
        </div>

        {/* Operational Search Input */}
        <div>
          <PackageSearchInput
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={handleClear}
            isLoading={isLoading}
            autoFocus
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-3">
        {/* State 1: Empty Query Guidance */}
        {!hasQuery && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-action-primary mb-4">
              <Package className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h2 className="text-base font-semibold text-text-primary mb-1">
              Find a package
            </h2>
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              Search by customer name, phone number, pickup code or package ID.
            </p>
          </div>
        )}

        {/* State 2: Results List */}
        {hasQuery && hasResults && (
          <PackageSearchResults
            results={results}
            onSelectResult={handleSelect}
            activePickupPointId={activePickupPointId}
          />
        )}

        {/* State 3: No Results State */}
        {showNoResults && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-subtle text-text-muted mb-4">
              <Search className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h2 className="text-base font-semibold text-text-primary mb-1">
              No packages found
            </h2>
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
              {!isOnline
                ? 'No matching packages found on this device. Try another name, phone number, pickup code or package ID.'
                : 'Try another name, phone number, pickup code or package ID.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
