import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PackageSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  isLoading?: boolean;
}

export const PackageSearchInput = React.forwardRef<HTMLInputElement, PackageSearchInputProps>(
  ({ className, value, onChange, onClear, isLoading, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        <label htmlFor="package-search-field" className="sr-only">
          Find a package
        </label>
        
        <div className="absolute left-4 pointer-events-none flex items-center justify-center text-text-muted">
          <Search className="h-5 w-5" aria-hidden="true" />
        </div>

        <input
          id="package-search-field"
          type="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            'flex h-14 w-full rounded-2xl border border-border-default bg-surface-default pl-12 pr-12 text-base text-text-primary placeholder:text-text-muted shadow-sm transition-all focus-visible:outline-none focus-visible:border-action-primary focus-visible:ring-2 focus-visible:ring-action-primary/20',
            className
          )}
          value={value}
          onChange={onChange}
          ref={ref}
          placeholder="Search name, phone, pickup code or package ID"
          {...props}
        />

        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-xl text-text-muted hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary active:scale-95 transition-all cursor-pointer"
            aria-label="Clear package search"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <X className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    );
  }
);

PackageSearchInput.displayName = 'PackageSearchInput';
