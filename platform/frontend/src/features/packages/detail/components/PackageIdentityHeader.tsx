import { ArrowLeft, CloudOff, CheckCircle2 } from 'lucide-react';
import type { LocalPackage } from '@/offline/db/schema';

interface PackageIdentityHeaderProps {
  pkg: LocalPackage;
  onBack: () => void;
  isOnline: boolean;
}

export function PackageIdentityHeader({
  pkg,
  onBack,
  isOnline,
}: PackageIdentityHeaderProps) {
  const isPendingSync = pkg.sync_status === 'PENDING_CREATE';

  return (
    <header className="sticky top-0 z-20 bg-surface-page/95 backdrop-blur-md px-4 pt-3 pb-3 border-b border-border-subtle flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-active transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Package details
          </h1>
          <p className="text-xs font-mono font-medium text-text-secondary uppercase">
            {pkg.public_package_id}
          </p>
        </div>
      </div>

      {/* Sync / Offline Status Badges */}
      <div className="flex items-center gap-1.5">
        {!isOnline && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-active text-text-secondary border border-border-subtle">
            <CloudOff className="w-3 h-3 text-status-warning-text" />
            <span>Offline</span>
          </span>
        )}
        {isPendingSync && isOnline && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-action-primary/10 text-action-primary border border-action-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-action-primary animate-pulse" />
            <span>Saved locally</span>
          </span>
        )}
        {pkg.sync_status === 'SYNCED' && isOnline && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success-bg text-status-success-text border border-status-success-border">
            <CheckCircle2 className="w-3 h-3" />
            <span>Synced</span>
          </span>
        )}
      </div>
    </header>
  );
}
