import type { ChangeEvent, KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Logo } from '@/features/auth/components/Logo';
import { PackagesStrings } from '@/features/packages/strings';

export interface PackagesListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

/**
 * Solid blue header for Packages list.
 * Includes title and full-width 60px search bar with live cross-tab query capability.
 */
export function PackagesListHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
}: PackagesListHeaderProps) {
  const isSearching = searchQuery.trim().length > 0;

  return (
    <header className="flex-none bg-[var(--pd-blue)] pt-3 pb-4 px-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Logo tone="blue" />
        <h1 className="text-[20px] sm:text-[22px] font-extrabold text-white tracking-tight m-0">
          {PackagesStrings.title}
        </h1>
      </div>

      {/* 60px White Search Input Container */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--pd-muted)]">
          <Search className="w-5 h-5" aria-hidden="true" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') {
              onClearSearch();
            }
          }}
          placeholder={PackagesStrings.searchPlaceholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full h-[60px] pl-12 pr-12 rounded-[var(--pd-field-radius)] bg-white text-[17px] font-semibold text-[var(--pd-navy)] placeholder:text-[var(--pd-muted)] border border-[var(--pd-line)] shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--pd-blue-hover)] focus:border-transparent transition-all"
          aria-label={PackagesStrings.searchPlaceholder}
        />

        {isSearching && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute inset-y-0 right-1 my-auto w-12 h-12 flex items-center justify-center text-[var(--pd-muted)] hover:text-[var(--pd-navy)] active:scale-95 transition-transform"
            aria-label={PackagesStrings.clearSearch}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Cross-tab search announcement */}
      {isSearching && (
        <div className="flex items-center gap-1.5 text-white text-[15px] font-bold px-1" role="status">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>{PackagesStrings.searchingCaption}</span>
        </div>
      )}
    </header>
  );
}
