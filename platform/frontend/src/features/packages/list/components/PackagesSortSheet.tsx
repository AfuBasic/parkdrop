import { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PackagesStrings } from '@/features/packages/strings';
import type { SortOrder } from '@/features/packages/domain/package-filters';

export interface PackagesSortSheetProps {
  currentSort: SortOrder;
  onSelectSort: (sort: SortOrder) => void;
  filterSummaryText: string | null;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function PackagesSortSheet({
  currentSort,
  onSelectSort,
  filterSummaryText,
  hasActiveFilters,
  onClearFilters,
}: PackagesSortSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getSortLabel = (sort: SortOrder) => {
    switch (sort) {
      case 'oldest':
        return PackagesStrings.sortOldestFirst;
      case 'newest':
        return PackagesStrings.sortNewestFirst;
      case 'amount':
        return PackagesStrings.sortHighestAmount;
    }
  };

  const sortOptions: Array<{ id: SortOrder; label: string }> = [
    { id: 'oldest', label: PackagesStrings.sortOldestFirst },
    { id: 'newest', label: PackagesStrings.sortNewestFirst },
    { id: 'amount', label: PackagesStrings.sortHighestAmount },
  ];

  return (
    <>
      <div className="flex-none px-4 py-2 bg-white flex items-center justify-between border-b border-[var(--pd-line-2)] text-[15px]">
        {/* Left: Summary Line or Sort trigger */}
        <div className="flex items-center gap-2 min-w-0">
          {hasActiveFilters && filterSummaryText && (
            <span className="font-extrabold text-[var(--pd-navy)] truncate">
              {filterSummaryText}
            </span>
          )}
        </div>

        {/* Right: Sort selector + Clear button */}
        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-[48px] px-2 text-[15px] font-extrabold text-[var(--pd-blue)] hover:underline active:scale-95"
            >
              {PackagesStrings.clearFilters}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="min-h-[48px] px-2.5 py-1.5 rounded-lg text-[15px] font-extrabold text-[var(--pd-muted)] hover:text-[var(--pd-navy)] bg-[var(--pd-page)] border border-[var(--pd-line)] flex items-center gap-1.5 active:scale-95"
          >
            <span>{getSortLabel(currentSort)}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 56px Radio rows Bottom Sheet Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-[360px] bg-white rounded-[var(--pd-card-radius)] p-5 shadow-2xl border border-[var(--pd-line)] animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[20px] font-extrabold text-[var(--pd-navy)]">
                {PackagesStrings.sortTitle}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 -mr-1 text-[var(--pd-muted)] hover:text-[var(--pd-navy)] rounded-full hover:bg-[var(--pd-page)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col divide-y divide-[var(--pd-line-2)]">
              {sortOptions.map((opt) => {
                const isSelected = currentSort === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelectSort(opt.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full min-h-[56px] px-3 flex items-center justify-between text-left text-[17px] font-extrabold transition-colors active:scale-98',
                      isSelected ? 'text-[var(--pd-blue)]' : 'text-[var(--pd-navy)] hover:bg-[var(--pd-page)]'
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-[var(--pd-blue)] stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
