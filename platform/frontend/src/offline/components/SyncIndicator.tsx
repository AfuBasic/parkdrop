import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SyncUIState } from '@/offline/hooks/useSyncState';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SyncIndicatorProps {
  state: SyncUIState;
  className?: string;
}

export function SyncIndicator({ state, className }: SyncIndicatorProps) {
  const { connectivity, pendingCount, conflictCount, isSyncing } = state;

  if (conflictCount > 0) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-danger-bg border border-status-danger-border text-status-danger-text-strong text-sm font-medium", className)}>
        <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
        <span>{conflictCount} {conflictCount === 1 ? 'item needs' : 'items need'} attention</span>
      </div>
    );
  }

  if (connectivity === 'UNREACHABLE' || connectivity === 'DEGRADED') {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-warning-bg border border-status-warning-border text-status-warning-text text-sm font-medium", className)}>
        <CloudOff className="w-4 h-4 text-[#D97706]" />
        <span>Offline {pendingCount > 0 && `· ${pendingCount} changes waiting`}</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-info-bg border border-status-info-border text-status-info-text text-sm font-medium", className)}>
        <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
        <span>Syncing…</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-info-bg border border-status-info-border text-status-info-text text-sm font-medium", className)}>
        <Cloud className="w-4 h-4 text-[#2563EB]" />
        <span>Saved on this device</span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-success-bg border border-status-success-border text-status-success-text text-sm font-medium", className)}>
      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
      <span>Synced</span>
    </div>
  );
}
