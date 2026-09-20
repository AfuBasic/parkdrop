import { Package } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useRecentPackages } from '@/offline/queries/homeSelectors';
import { PackageListItem } from './PackageListItem';

interface RecentPackagesProps {
  onSeeAll?: () => void;
  onAddPackage?: () => void;
}

export function RecentPackages({ onSeeAll, onAddPackage }: RecentPackagesProps) {
  const { business } = useAuth();
  const recentPackages = useRecentPackages(business?.id, 5);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[var(--text-body-lg)] font-bold text-text-primary tracking-tight">Recent packages</h2>
        {recentPackages.length > 0 && onSeeAll && (
          <button 
            onClick={onSeeAll}
            className="text-[var(--text-body-md)] font-medium text-action-primary hover:text-action-primary-hover focus-visible:outline-none focus-visible:underline"
          >
            See all
          </button>
        )}
      </div>

      {recentPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-[var(--radius-xl)] bg-surface-default border border-border-subtle shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-page mb-4 text-action-primary">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-[var(--text-body-lg)] font-semibold text-text-primary mb-2">No packages yet</h3>
          <p className="text-[var(--text-body-md)] text-text-secondary max-w-[250px] mb-6">
            Packages you receive will appear here.
          </p>
          <button 
            onClick={onAddPackage}
            className="px-5 py-2.5 bg-surface-page border border-border-default hover:bg-surface-subtle text-text-primary font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            Add your first package
          </button>
        </div>
      ) : (
        <div className="bg-surface-default rounded-[var(--radius-xl)] p-2 sm:p-4 shadow-sm border border-border-subtle">
          {recentPackages.map(pkg => (
            <PackageListItem key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}
