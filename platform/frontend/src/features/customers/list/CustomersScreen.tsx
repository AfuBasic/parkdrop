import { useState, useId } from 'react';
import { Search, X, Users, PackagePlus } from 'lucide-react';
import { useCustomerDirectory } from '../hooks/useCustomerDirectory';
import { CustomerListItem } from './components/CustomerListItem';
import type { CustomerDirectoryItem } from '../domain/customer-types';

interface CustomersScreenProps {
  businessId: number;
  onSelectCustomer: (customerId: string) => void;
  onNavigateToAdd?: () => void;
}

export function CustomersScreen({
  businessId,
  onSelectCustomer,
  onNavigateToAdd,
}: CustomersScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const searchInputId = useId();

  const { items, totalCount, isLoading } = useCustomerDirectory(
    businessId,
    searchQuery,
    pageSize,
    0
  );

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-page w-full max-w-lg mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface-page/95 backdrop-blur-sm border-b border-border-subtle px-4 pt-4 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Customers
            </h1>
            {!isLoading && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-subtle text-text-secondary border border-border-subtle tabular-nums">
                {totalCount}
              </span>
            )}
          </div>

          {onNavigateToAdd && (
            <button
              type="button"
              onClick={onNavigateToAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-action-primary text-white text-xs font-semibold shadow-sm hover:bg-action-primary/90 active:scale-95 transition-all cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Add package</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <label htmlFor={searchInputId} className="sr-only">
            Search customers by name or phone
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search className="h-4 w-4" />
          </div>
          <input
            id={searchInputId}
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name or phone"
            className="w-full pl-9 pr-9 py-2.5 bg-surface-default border border-border-default rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-action-primary focus:border-transparent transition-all shadow-sm"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear customer search"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {isLoading && (
          <div className="p-4 flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map(n => (
              <div
                key={n}
                className="h-16 bg-surface-subtle animate-pulse rounded-xl border border-border-subtle"
              />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="p-8 flex flex-col items-center justify-center text-center mt-12">
            <div className="w-14 h-14 rounded-2xl bg-surface-subtle border border-border-subtle flex items-center justify-center text-text-muted mb-4 shadow-sm">
              <Users className="w-7 h-7" />
            </div>

            {searchQuery.trim().length > 0 ? (
              <>
                <h2 className="text-base font-bold text-text-primary">No customers found</h2>
                <p className="text-sm text-text-secondary mt-1 max-w-xs">
                  Try another name or phone number.
                </p>
                <button
                  type="button"
                  onClick={handleClear}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-action-primary bg-action-primary/10 hover:bg-action-primary/20 transition-colors"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h2 className="text-base font-bold text-text-primary">No customers yet</h2>
                <p className="text-sm text-text-secondary mt-1 max-w-xs">
                  Customers appear here when you record packages.
                </p>
                {onNavigateToAdd && (
                  <button
                    type="button"
                    onClick={onNavigateToAdd}
                    className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-action-primary hover:bg-action-primary/90 shadow-sm transition-all cursor-pointer"
                  >
                    Add package
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="flex flex-col divide-y divide-border-subtle bg-surface-default shadow-sm border-b border-border-subtle">
            {items.map(item => (
              <CustomerListItem
                key={item.id}
                item={item}
                onSelect={(selected: CustomerDirectoryItem) => onSelectCustomer(selected.id)}
              />
            ))}
          </div>
        )}

        {/* Load More pagination button */}
        {!isLoading && totalCount > items.length && (
          <div className="p-4 flex justify-center">
            <button
              type="button"
              onClick={() => setPageSize(prev => prev + 50)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-default border border-border-default text-text-primary hover:bg-surface-subtle active:bg-surface-active transition-colors shadow-sm"
            >
              Load more customers
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
