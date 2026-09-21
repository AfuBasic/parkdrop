import type { PackageListRowItem } from '@/features/packages/list/package-list-types';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { formatMoney, formatPhone } from '@/lib/formatters';

interface PackageListRowProps {
  pkg: PackageListRowItem;
  onSelect?: (pkg: PackageListRowItem) => void;
}

export function PackageListRow({ pkg, onSelect }: PackageListRowProps) {
  const getVariant = (status: PackageListRowItem['status']) => {
    switch (status) {
      case 'WAITING':
        return 'neutral';
      case 'COLLECTED':
        return 'success';
      case 'RETURNED':
        return 'warning';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      if (isToday) {
        return `Today · ${timeString}`;
      }
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${timeString}`;
    } catch {
      return '';
    }
  };

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => onSelect?.(pkg)}
        className="w-full text-left flex flex-col gap-1 py-3 px-3 sm:px-4 rounded-xl border-b border-border-subtle hover:bg-surface-subtle active:bg-surface-subtle/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary transition-colors cursor-pointer"
        aria-label={`${pkg.customerName}, package ${pkg.publicPackageId}, pickup code ${pkg.pickupCode}, ${pkg.status.toLowerCase()}`}
      >
        {/* Top Row: Customer Name & Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-text-primary text-base truncate">
              {pkg.customerName}
            </span>
            {pkg.syncStatus === 'PENDING_CREATE' && (
              <span className="shrink-0 text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Local
              </span>
            )}
          </div>
          <StatusBadge variant={getVariant(pkg.status)} className="shrink-0">
            {pkg.status.charAt(0) + pkg.status.slice(1).toLowerCase()}
          </StatusBadge>
        </div>

        {/* Middle Row: Phone & Package Identifiers */}
        <div className="flex items-center justify-between text-xs text-text-secondary mt-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span>{formatPhone(pkg.customerPhone)}</span>
            <span className="text-text-muted">·</span>
            <span className="font-mono font-medium text-text-primary tracking-wide">
              {pkg.publicPackageId}
            </span>
            <span className="text-text-muted">·</span>
            <span className="font-mono font-semibold text-action-primary bg-action-primary/5 px-1 rounded">
              {pkg.pickupCode}
            </span>
          </div>
        </div>

        {/* Bottom Row: Received Time & Amount */}
        <div className="flex items-center justify-between text-xs text-text-secondary mt-1">
          <span>{getRelativeTime(pkg.clientCreatedAt)}</span>
          <span className="font-semibold text-text-primary shrink-0">
            {formatMoney(pkg.amountDueMinor)}
          </span>
        </div>
      </button>
    </li>
  );
}
