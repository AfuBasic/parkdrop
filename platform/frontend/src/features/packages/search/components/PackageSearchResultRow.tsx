import type { PackageSearchResult } from '@/features/packages/search/package-search-types';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { formatMoney, formatPhone } from '@/lib/formatters';

interface PackageSearchResultRowProps {
  result: PackageSearchResult;
  onSelect?: (result: PackageSearchResult) => void;
  activePickupPointId?: number | null;
}

export function PackageSearchResultRow({
  result,
  onSelect,
  activePickupPointId,
}: PackageSearchResultRowProps) {
  const getVariant = (status: PackageSearchResult['status']) => {
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

  const isOtherLocation =
    activePickupPointId !== undefined &&
    activePickupPointId !== null &&
    result.pickupPointId !== null &&
    result.pickupPointId !== activePickupPointId;

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => onSelect?.(result)}
        className="w-full text-left flex flex-col gap-1 py-3 px-3 sm:px-4 rounded-xl border-b border-border-subtle hover:bg-surface-subtle active:bg-surface-subtle/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary transition-colors cursor-pointer"
        aria-label={`${result.customerName}, package ${result.publicPackageId}, pickup code ${result.pickupCode}, ${result.status.toLowerCase()}`}
      >
        {/* Top Row: Customer Name & Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-text-primary text-base truncate">
              {result.customerName}
            </span>
            {result.syncStatus === 'PENDING_CREATE' && (
              <span className="shrink-0 text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Local
              </span>
            )}
          </div>
          <StatusBadge variant={getVariant(result.status)} className="shrink-0">
            {result.status.charAt(0) + result.status.slice(1).toLowerCase()}
          </StatusBadge>
        </div>

        {/* Middle Row: Phone & Package Identifiers */}
        <div className="flex items-center justify-between text-xs text-text-secondary mt-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span>{formatPhone(result.phoneDisplay)}</span>
            <span className="text-text-muted">·</span>
            <span className="font-mono font-medium text-text-primary tracking-wide">
              {result.publicPackageId}
            </span>
            <span className="text-text-muted">·</span>
            <span className="font-mono font-semibold text-action-primary bg-action-primary/5 px-1 rounded">
              {result.pickupCode}
            </span>
          </div>
        </div>

        {/* Bottom Row: Received Time, Amount, & Optional Cross-Location Tag */}
        <div className="flex items-center justify-between text-xs text-text-secondary mt-1">
          <div className="flex items-center gap-1.5 truncate">
            <span>{getRelativeTime(result.clientCreatedAt)}</span>
            {isOtherLocation && (
              <>
                <span className="text-text-muted">·</span>
                <span className="text-amber-700 font-medium bg-amber-50 px-1 rounded border border-amber-200 truncate">
                  {result.pickupPointName || `Point #${result.pickupPointId}`}
                </span>
              </>
            )}
          </div>
          <span className="font-semibold text-text-primary shrink-0">
            {formatMoney(result.amountDueMinor)}
          </span>
        </div>
      </button>
    </li>
  );
}
