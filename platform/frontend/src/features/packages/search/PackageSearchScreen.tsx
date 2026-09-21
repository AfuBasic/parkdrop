import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Package, Search } from 'lucide-react';
import { PackageSearchInput } from '@/features/packages/search/components/PackageSearchInput';
import { PackageSearchResults } from '@/features/packages/search/components/PackageSearchResults';
import { usePackageSearch } from '@/features/packages/search/hooks/usePackageSearch';
import { useAuth } from '@/features/auth/AuthContext';
import type { PackageSearchResult } from '@/features/packages/search/package-search-types';

interface PackageSearchScreenProps {
  onBack?: () => void;
  onSelectPackage?: (result: PackageSearchResult) => void;
  onNavigateToAdd?: (phone?: string) => void;
  initialQuery?: string;
}

export function PackageSearchScreen({
  onBack,
  onSelectPackage,
  onNavigateToAdd,
  initialQuery = '',
}: PackageSearchScreenProps) {
  const { business } = useAuth();
  const businessId = business?.id || 0;
  const activePickupPointId = null; // Can be wired to active pickup point when multi-point selection is added

  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { results, isLoading, debouncedQuery } = usePackageSearch({
    query,
    businessId,
    activePickupPointId,
  });

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

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;
  const showNoResults = hasQuery && !isLoading && !hasResults && debouncedQuery.trim().length >= 2;

  return (
    <div className="flex flex-col min-h-screen bg-bg-surface-page pb-12">
      {/* Search Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-border-subtle px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-bg-action-hover active:bg-border-subtle transition-colors text-text-primary"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Find package
            </h1>
          </div>
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
            <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-5">
              Try another name, phone number, pickup code or package ID.
            </p>
            {onNavigateToAdd && (
              <button
                type="button"
                onClick={() => onNavigateToAdd(query)}
                className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] text-white font-extrabold text-[15px] hover:bg-[var(--pd-blue-hover)] active:scale-[0.98] transition-transform"
              >
                Add package for this number
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
