import { Package } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useRecentPackages } from '@/offline/queries/homeSelectors';
import { PackageListItem } from './PackageListItem';

interface RecentPackagesProps {
  onSeeAll?: () => void;
  onAddPackage?: () => void;
  onSelectPackage?: (packageId: string) => void;
}

export function RecentPackages({ onSeeAll, onAddPackage, onSelectPackage }: RecentPackagesProps) {
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
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-[var(--radius-xl)] bg-surface-default border border-border-subtle shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 mb-3 text-action-primary">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1.5">No packages yet</h3>
          <p className="text-xs text-text-secondary max-w-[260px] mb-5 leading-relaxed">
            Record your first package to start managing customer pickups and SMS notifications.
          </p>
          <button 
            onClick={onAddPackage}
            className="px-6 py-3 bg-action-primary hover:bg-action-primary-hover active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer min-h-[48px] flex items-center justify-center"
          >
            Add your first package
          </button>
        </div>
      ) : (
        <div className="bg-surface-default rounded-[var(--radius-xl)] p-2 sm:p-4 shadow-sm border border-border-subtle">
          {recentPackages.map(pkg => (
            <PackageListItem key={pkg.id} pkg={pkg} onSelect={(item) => onSelectPackage?.(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
