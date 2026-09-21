import { CheckCircle2, PackagePlus } from 'lucide-react';
import { PackagesStrings } from '../strings';

export interface PackageListEmptyStateProps {
  isPositiveFilterEmpty?: boolean;
  filterType?: 'unpaid' | '7d';
  onClearFilters?: () => void;
  onAddPackage?: () => void;
}

export function PackageListEmptyState({
  isPositiveFilterEmpty = false,
  filterType,
  onClearFilters,
  onAddPackage,
}: PackageListEmptyStateProps) {
  if (isPositiveFilterEmpty) {
    const text =
      filterType === 'unpaid'
        ? PackagesStrings.emptyNoUnpaid
        : PackagesStrings.emptyNo7Days;

    return (
      <div className="py-12 px-6 flex flex-col items-center justify-center text-center gap-3 bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] shadow-xs my-4">
        <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center border border-[#86EFAC]">
          <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
        </div>
        <p className="text-[17px] font-extrabold text-[var(--pd-navy)] max-w-[280px] m-0">
          {text}
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="min-h-[48px] px-4 text-[16px] font-extrabold text-[var(--pd-blue)] hover:underline active:scale-95"
          >
            {PackagesStrings.clearFilters}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-12 px-6 flex flex-col items-center justify-center text-center gap-3 bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] shadow-xs my-4">
      <p className="text-[17px] font-extrabold text-[var(--pd-muted)] m-0">
        {PackagesStrings.emptyNoPackagesYet}
      </p>
      {onAddPackage && (
        <button
          type="button"
          onClick={onAddPackage}
          className="min-h-[48px] px-5 py-2.5 rounded-[var(--pd-field-radius)] bg-[var(--pd-blue)] text-white text-[16px] font-extrabold flex items-center gap-2 shadow-xs hover:bg-[var(--pd-blue-hover)] active:scale-95 transition-transform"
        >
          <PackagePlus className="w-5 h-5" />
          <span>{PackagesStrings.addPackageAction}</span>
        </button>
      )}
    </div>
  );
}
