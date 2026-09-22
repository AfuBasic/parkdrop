import { formatMoney } from '@/lib/formatters';
import type { DailyOperationalEventItem } from '@/features/reports/report-types';
import { ReportsStrings } from '@/features/reports/strings';

interface DailyActivityRowProps {
  event: DailyOperationalEventItem;
  showPickupPoint?: boolean;
}

const EVENT_TONE: Record<string, { text: string; bg: string }> = {
  PACKAGE_RECEIVED: { text: 'var(--pd-blue)', bg: 'var(--pd-tint)' },
  PACKAGE_COLLECTED: { text: 'var(--pd-navy)', bg: 'var(--pd-page-2)' },
  PACKAGE_RETURNED: { text: 'var(--pd-warn)', bg: 'var(--pd-warn-bg)' },
  PACKAGE_CANCELLED: { text: 'var(--pd-bad)', bg: 'var(--pd-bad-bg)' },
  PAYMENT_RECORDED: { text: 'var(--pd-ok)', bg: 'var(--pd-ok-bg)' },
  PAYMENT_REVERSED: { text: 'var(--pd-bad)', bg: 'var(--pd-bad-bg)' },
};

export function DailyActivityRow({ event, showPickupPoint = false }: DailyActivityRowProps) {
  const timeFormatted = new Date(event.eventTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const label = ReportsStrings.eventLabel[event.type as keyof typeof ReportsStrings.eventLabel];
  const tone = EVENT_TONE[event.type];

  return (
    <li className="p-3 bg-white border border-[var(--pd-line-2)] rounded-[var(--pd-field-radius)] flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {label && tone && (
            <span
              className="text-[15px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: tone.text, backgroundColor: tone.bg }}
            >
              {label}
            </span>
          )}
          {event.amountMinor !== null && event.amountMinor !== undefined && (
            <span className="font-extrabold text-[15px] text-[var(--pd-navy)] tabular-nums">
              {formatMoney(event.amountMinor)}
              {event.paymentMethod && (
                <span className="font-semibold text-[var(--pd-muted)] ml-1">
                  · {event.paymentMethod.charAt(0).toUpperCase() + event.paymentMethod.slice(1).toLowerCase()}
                </span>
              )}
            </span>
          )}
        </div>
        <span className="text-[15px] font-semibold text-[var(--pd-muted)] tabular-nums shrink-0">{timeFormatted}</span>
      </div>

      <div className="flex items-center justify-between gap-2 text-[15px]">
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {event.publicPackageId && (
            <span className="font-bold text-[var(--pd-navy)]">{event.publicPackageId}</span>
          )}
          {event.customerName && (
            <>
              <span className="text-[var(--pd-muted)]">·</span>
              <span className="text-[var(--pd-muted)] font-semibold truncate">{event.customerName}</span>
            </>
          )}
          {showPickupPoint && event.pickupPointName && (
            <>
              <span className="text-[var(--pd-muted)]">·</span>
              <span className="text-[var(--pd-muted)] font-semibold truncate">{event.pickupPointName}</span>
            </>
          )}
        </div>
        <span className="text-[var(--pd-muted)] font-semibold shrink-0">{event.actorName}</span>
      </div>

      {event.details && (
        <div className="text-[15px] text-[var(--pd-muted)] font-semibold bg-[var(--pd-page-2)] px-2 py-1 rounded-[var(--pd-chip-radius)]">
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
      <div className="p-6 text-center bg-white border border-[var(--pd-line-2)] rounded-[var(--pd-card-radius)]">
        <p className="text-[16px] font-semibold text-[var(--pd-muted)] m-0">{ReportsStrings.noActivity}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-extrabold text-[var(--pd-navy)] m-0">{ReportsStrings.activityHeading}</h3>
        <span className="text-[15px] font-semibold text-[var(--pd-muted)] tabular-nums">
          {ReportsStrings.eventsCount(events.length)}
        </span>
      </div>
      <ul className="flex flex-col gap-2 list-none p-0 m-0">
        {events.map((event) => (
          <DailyActivityRow key={event.id} event={event} showPickupPoint={showPickupPoint} />
        ))}
      </ul>
    </div>
  );
}
