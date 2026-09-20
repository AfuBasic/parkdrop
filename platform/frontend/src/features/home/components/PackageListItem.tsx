import type { LocalPackage } from '@/offline/db/schema';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { formatMoney, formatPhone } from '@/lib/formatters';

interface PackageListItemProps {
  pkg: LocalPackage;
}

export function PackageListItem({ pkg }: PackageListItemProps) {
  // Map our domain statuses to the design system badge variants
  const getVariant = (status: LocalPackage['status']) => {
    switch (status) {
      case 'WAITING': return 'neutral';
      case 'COLLECTED': return 'success';
      case 'RETURNED': return 'warning';
      case 'CANCELLED': return 'danger';
      default: return 'neutral';
    }
  };

  // Convert the ISO date to a friendly relative format for "Today", etc.
  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
    
    const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    if (isToday) {
      return `Today · ${timeString}`;
    }
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${timeString}`;
  };

  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-subtle transition-colors -mx-4 px-4 sm:mx-0 sm:px-2 rounded-lg cursor-pointer">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-text-primary text-[var(--text-body-md)] truncate pr-4">
          {pkg.customer_name}
        </span>
        <StatusBadge variant={getVariant(pkg.status)} className="flex-shrink-0">
          {pkg.status.charAt(0) + pkg.status.slice(1).toLowerCase()}
        </StatusBadge>
      </div>
      
      <div className="flex items-center justify-between text-[var(--text-caption)] text-text-secondary mt-1">
        <div className="flex items-center gap-1.5 truncate">
          <span>{formatPhone(pkg.customer_phone)}</span>
          <span className="text-text-muted">·</span>
          <span className="font-medium text-text-primary">{pkg.pickup_code || pkg.id.slice(0, 8)}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-[var(--text-caption)] text-text-secondary mt-1">
        <span>{getRelativeTime(pkg.created_at)}</span>
        <span className="font-semibold text-text-primary">{formatMoney(pkg.amount_due)}</span>
      </div>
    </div>
  );
}
