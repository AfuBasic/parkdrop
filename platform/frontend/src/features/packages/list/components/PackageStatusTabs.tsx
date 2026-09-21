import type { PackageStatusFilter, StatusCounts } from '@/features/packages/list/package-list-types';
import { cn } from '@/lib/utils';

interface PackageStatusTabsProps {
  activeStatus: PackageStatusFilter;
  counts: StatusCounts;
  onSelectStatus: (status: PackageStatusFilter) => void;
}

const TABS: Array<{ id: PackageStatusFilter; label: string }> = [
  { id: 'WAITING', label: 'Waiting' },
  { id: 'COLLECTED', label: 'Collected' },
  { id: 'RETURNED', label: 'Returned' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export function PackageStatusTabs({
  activeStatus,
  counts,
  onSelectStatus,
}: PackageStatusTabsProps) {
  return (
    <div className="w-full border-b border-border-default bg-surface-page" role="tablist" aria-label="Package status filters">
      <div className="flex items-center justify-between sm:justify-start sm:gap-2">
        {TABS.map((tab) => {
          const isActive = activeStatus === tab.id;
          const count = counts[tab.id] ?? 0;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id.toLowerCase()}`}
              aria-controls={`panel-${tab.id.toLowerCase()}`}
              aria-selected={isActive}
              onClick={() => onSelectStatus(tab.id)}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-3.5 px-2 sm:px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer min-h-[44px]',
                isActive
                  ? 'border-action-primary text-action-primary bg-action-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  isActive
                    ? 'bg-action-primary text-text-inverse'
                    : 'bg-surface-subtle text-text-secondary border border-border-subtle'
                )}
                aria-label={`${count} packages`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
