import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { LocalPackage } from '@/offline/db/schema';
import { StatusBadge } from '@/design-system/components/StatusBadge';

interface PackagePickupCodeCardProps {
  pkg: LocalPackage;
}

export function PackagePickupCodeCard({ pkg }: PackagePickupCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!pkg.pickup_code) return;
    navigator.clipboard.writeText(pkg.pickup_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusVariant = (status: LocalPackage['status']) => {
    switch (status) {
      case 'COLLECTED': return 'success';
      case 'RETURNED': return 'warning';
      case 'CANCELLED': return 'danger';
      case 'WAITING':
      default:
        return 'neutral';
    }
  };

  return (
    <div className="bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle p-5 shadow-xs flex flex-col items-center text-center gap-2.5">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Pickup code
        </span>
        <StatusBadge variant={getStatusVariant(pkg.status)}>
          {pkg.status}
        </StatusBadge>
      </div>

      <div className="flex items-center justify-center gap-3 my-1">
        <span className="text-4xl sm:text-5xl font-extrabold font-mono text-text-primary tracking-widest tabular-nums select-all">
          {pkg.pickup_code}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="p-2 text-text-muted hover:text-action-primary hover:bg-action-primary/10 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Copy pickup code"
        >
          {copied ? (
            <Check className="w-5 h-5 text-status-success-text" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>
      </div>

      {copied ? (
        <p className="text-xs font-semibold text-status-success-text animate-in fade-in duration-200">
          Pickup code copied to clipboard
        </p>
      ) : (
        <p className="text-[11px] text-text-muted">
          Customer provides this 7-character code upon parcel collection.
        </p>
      )}
    </div>
  );
}
