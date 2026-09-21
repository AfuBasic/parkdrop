import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/design-system';
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

      {/* 56px Radio rows Bottom Sheet */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-[360px] p-5 rounded-[var(--pd-card-radius)]">
          <DialogTitle className="text-[20px] font-extrabold text-[var(--pd-navy)] mb-3">
            {PackagesStrings.sortTitle}
          </DialogTitle>

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
        </DialogContent>
      </Dialog>
    </>
  );
}
