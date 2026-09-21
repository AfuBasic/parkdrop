import { formatMoney } from '@/lib/formatters';
import type { DailyOperationalEventItem } from '@/features/reports/report-types';

interface DailyActivityRowProps {
  event: DailyOperationalEventItem;
  showPickupPoint?: boolean;
}

export function DailyActivityRow({ event, showPickupPoint = false }: DailyActivityRowProps) {
  const timeFormatted = new Date(event.eventTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getEventBadge = () => {
    switch (event.type) {
      case 'PACKAGE_RECEIVED':
        return <span className="text-[11px] font-semibold text-action-primary bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Package received</span>;
      case 'PACKAGE_COLLECTED':
        return <span className="text-[11px] font-semibold text-text-primary bg-surface-subtle px-2 py-0.5 rounded-full border border-border-subtle">Package collected</span>;
      case 'PACKAGE_RETURNED':
        return <span className="text-[11px] font-semibold text-status-warning-text bg-status-warning-bg px-2 py-0.5 rounded-full border border-status-warning-border">Package returned</span>;
      case 'PACKAGE_CANCELLED':
        return <span className="text-[11px] font-semibold text-status-danger-text bg-status-danger-bg px-2 py-0.5 rounded-full border border-status-danger-border">Package cancelled</span>;
      case 'PAYMENT_RECORDED':
        return <span className="text-[11px] font-semibold text-action-primary bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">Payment recorded</span>;
      case 'PAYMENT_REVERSED':
        return <span className="text-[11px] font-semibold text-status-danger-text bg-status-danger-bg px-2 py-0.5 rounded-full border border-status-danger-border">Payment reversed</span>;
      default:
        return null;
    }
  };

  return (
    <li className="p-3 bg-surface-default border border-border-subtle rounded-[var(--radius-lg)] flex flex-col gap-1.5 transition-colors hover:bg-surface-subtle/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getEventBadge()}
          {event.amountMinor !== null && event.amountMinor !== undefined && (
            <span className="font-bold text-xs text-text-primary tabular-nums">
              {formatMoney(event.amountMinor)}
              {event.paymentMethod && (
                <span className="font-normal text-text-muted ml-1">
                  · {event.paymentMethod.charAt(0).toUpperCase() + event.paymentMethod.slice(1).toLowerCase()}
                </span>
              )}
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted tabular-nums">{timeFormatted}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-1.5 truncate">
          {event.publicPackageId && (
            <span className="font-semibold text-text-primary">{event.publicPackageId}</span>
          )}
          {event.customerName && (
            <>
              <span className="text-text-muted">·</span>
              <span className="truncate">{event.customerName}</span>
            </>
          )}
          {showPickupPoint && event.pickupPointName && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-text-muted truncate">{event.pickupPointName}</span>
            </>
          )}
        </div>
        <span className="text-text-muted text-[11px] shrink-0">{event.actorName}</span>
      </div>

      {event.details && (
        <div className="text-[11px] text-text-muted italic bg-surface-subtle/50 px-2 py-0.5 rounded">
          {event.details}
        </div>
      )}
    </li>
  );
}

interface DailyActivityListProps {
  events: DailyOperationalEventItem[];
  showPickupPoint?: boolean;
}

export function DailyActivityList({ events, showPickupPoint = false }: DailyActivityListProps) {
  if (events.length === 0) {
    return (
      <div className="p-6 text-center bg-surface-default border border-border-subtle rounded-[var(--radius-xl)]">
        <p className="text-sm text-text-secondary font-medium">No activity recorded for this date.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Activity</h3>
        <span className="text-xs text-text-muted tabular-nums">{events.length} events</span>
      </div>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {events.map((event) => (
          <DailyActivityRow key={event.id} event={event} showPickupPoint={showPickupPoint} />
        ))}
      </ul>
    </div>
  );
}
