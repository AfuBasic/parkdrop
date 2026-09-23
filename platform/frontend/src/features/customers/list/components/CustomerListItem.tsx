import { User, ChevronRight, PackageCheck } from 'lucide-react';
import type { CustomerDirectoryItem } from '@/features/customers/domain/customer-types';
import { formatPhone } from '@/lib/formatters';

interface CustomerListItemProps {
  item: CustomerDirectoryItem;
  onSelect: (item: CustomerDirectoryItem) => void;
}

export function CustomerListItem({ item, onSelect }: CustomerListItemProps) {
  const isNameReal = item.name && !/^\+?\d+$/.test(item.name.replace(/\s+/g, ''));
  const displayName = isNameReal ? item.name : formatPhone(item.phoneDisplay);
  const firstChar = isNameReal ? item.name![0].toUpperCase() : '';
  const isLetter = /^[A-Z]$/.test(firstChar);

  const waitingLabel =
    item.waitingPackageCount === 0
      ? 'No packages waiting'
      : item.waitingPackageCount === 1
        ? '1 package waiting'
        : `${item.waitingPackageCount} packages waiting`;

  const totalLabel =
    item.totalPackageCount === 1
      ? '1 package'
      : `${item.totalPackageCount} packages`;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="w-full text-left bg-surface-default hover:bg-surface-subtle active:bg-surface-active/70 border-b border-border-subtle p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
      aria-label={`${item.name}, ${formatPhone(item.phoneDisplay)}, ${waitingLabel}, ${totalLabel}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Avatar circle with initials */}
        <div className="w-11 h-11 rounded-full bg-surface-subtle text-action-primary font-bold text-base flex items-center justify-center shrink-0 border border-border-subtle">
          {isLetter ? firstChar : <User className="w-5 h-5 text-text-muted" />}
        </div>

        {/* Customer Identity and counts */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary text-[15px] sm:text-base truncate">
              {displayName}
            </span>
            {item.syncStatus === 'PENDING_CREATE' && (
              <span className="shrink-0 text-[15px] font-semibold tracking-wide uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Local
              </span>
            )}
          </div>

          {isNameReal && (
            <div className="flex items-center gap-2 text-[15px] text-text-secondary mt-0.5 tabular-nums">
              <span>{formatPhone(item.phoneDisplay)}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[15px] mt-1.5 flex-wrap">
            {item.waitingPackageCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-medium text-action-primary bg-action-primary/10 px-2 py-0.5 rounded-md">
                <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                {waitingLabel}
              </span>
            ) : (
              <span className="text-text-muted">
                {totalLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
    </button>
  );
}
