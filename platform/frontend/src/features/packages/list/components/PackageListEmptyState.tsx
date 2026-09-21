import { Package, Plus } from 'lucide-react';
import type { PackageStatusFilter } from '@/features/packages/list/package-list-types';

interface PackageListEmptyStateProps {
  status: PackageStatusFilter;
  onAddPackage?: () => void;
}

export function PackageListEmptyState({ status, onAddPackage }: PackageListEmptyStateProps) {
  switch (status) {
    case 'WAITING':
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-action-primary mb-4">
            <Package className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            No packages waiting
          </h3>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-6">
            New packages you receive will appear here awaiting collection.
          </p>
          {onAddPackage && (
            <button
              type="button"
              onClick={onAddPackage}
              className="flex items-center justify-center gap-2 h-12 px-5 bg-action-primary hover:bg-action-primary-hover text-text-inverse font-semibold text-sm rounded-xl transition-colors shadow-sm active:scale-98 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add package</span>
            </button>
          )}
        </div>
      );

    case 'COLLECTED':
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-subtle text-text-muted mb-4">
            <Package className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            No collected packages yet
          </h3>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
            Packages will appear here once customers pick them up.
          </p>
        </div>
      );

    case 'RETURNED':
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-subtle text-text-muted mb-4">
            <Package className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            No returned packages
          </h3>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
            Packages returned to the sender or dispatch hub will show here.
          </p>
        </div>
      );

    case 'CANCELLED':
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-subtle text-text-muted mb-4">
            <Package className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            No cancelled packages
          </h3>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
            Packages that were cancelled will appear here for audit reference.
          </p>
        </div>
      );
  }
}
