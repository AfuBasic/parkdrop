import {
  AlertTriangle,
  AlertCircle,
  Info,
  ImageOff,
  Clock,
  ChevronRight,
  WifiOff,
} from 'lucide-react';
import type { AttentionItem } from '@/features/attention/attention-types';
import { AttentionStrings } from '@/features/attention/strings';

interface AttentionItemRowProps {
  item: AttentionItem;
  isOffline?: boolean;
  onAction?: (item: AttentionItem) => void;
}

function formatOccurredAt(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return AttentionStrings.justNow;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return AttentionStrings.yesterday;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function AttentionItemRow({
  item,
  isOffline = false,
  onAction,
}: AttentionItemRowProps) {
  const getIcon = () => {
    const cls = 'w-6 h-6';
    switch (item.type) {
      case 'PHOTO_UPLOAD_FAILED':
        return <ImageOff className={cls} aria-hidden="true" strokeWidth={2.25} />;
      case 'PAYMENT_SYNC_REJECTED':
      case 'ZERO_SMS_CREDITS':
        return <AlertCircle className={cls} aria-hidden="true" strokeWidth={2.25} />;
      case 'COLLECTION_SYNC_CONFLICT':
      case 'PACKAGE_LIFECYCLE_CONFLICT':
      case 'LOW_SMS_CREDITS':
      case 'SMS_CREDIT_PURCHASE_FAILED':
        return <AlertTriangle className={cls} aria-hidden="true" strokeWidth={2.25} />;
      case 'SMS_CREDIT_PURCHASE_PENDING':
        return <Clock className={cls} aria-hidden="true" strokeWidth={2.25} />;
      default:
        return <Info className={cls} aria-hidden="true" strokeWidth={2.25} />;
    }
  };

  // Colour never carries the meaning on its own (P3): the icon and the words
  // say it too, which is what survives a cheap LCD in direct sunlight.
  const getIconTone = () => {
    switch (item.severity) {
      case 'ERROR':
        return 'bg-[var(--pd-bad-bg)] border-[var(--pd-bad)]/25 text-[var(--pd-bad)]';
      case 'WARNING':
        return 'bg-[var(--pd-warn-bg)] border-[var(--pd-warn)]/25 text-[var(--pd-warn)]';
      case 'INFO':
      default:
        return 'bg-[var(--pd-tint)] border-[var(--pd-tint-2)] text-[var(--pd-blue)]';
    }
  };

  const isActionBlocked = Boolean(item.action?.requiresOnline && isOffline);

  const accessibleLabel = `${item.title}. ${
    item.metadata?.publicPackageId ? `Package ${item.metadata.publicPackageId}. ` : ''
  }${item.message}`;

  return (
    <article
      aria-label={accessibleLabel}
      className="bg-white border border-[var(--pd-line-2)] rounded-[var(--pd-card-radius)] p-4 shadow-xs flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        {/* Severity / Type Icon */}
        <div
          className={`w-11 h-11 rounded-[var(--pd-chip-radius)] flex items-center justify-center shrink-0 border ${getIconTone()}`}
        >
          {getIcon()}
        </div>

        {/* Content Block */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[18px] font-extrabold text-[var(--pd-navy)] leading-snug m-0">
              {item.title}
            </h3>
            {item.occurredAt && (
              <span className="text-[15px] font-semibold text-[var(--pd-muted)] shrink-0 pd-nums pt-0.5">
                {formatOccurredAt(item.occurredAt)}
              </span>
            )}
          </div>

          {/* Context: package ID and customer name */}
          {(item.metadata?.publicPackageId || item.metadata?.customerName) && (
            <div className="flex items-center gap-1.5 text-[16px] font-extrabold text-[var(--pd-blue)]">
              {item.metadata.publicPackageId && (
                <span className="tracking-wider pd-nums">{item.metadata.publicPackageId}</span>
              )}
              {item.metadata.publicPackageId && item.metadata.customerName && (
                <span className="text-[var(--pd-line)]">·</span>
              )}
              {item.metadata.customerName && (
                <span className="text-[var(--pd-muted)] font-semibold truncate">
                  {item.metadata.customerName}
                </span>
              )}
            </div>
          )}

          {/* Message Body */}
          <p className="text-[16px] font-semibold text-[var(--pd-muted)] leading-snug m-0">
            {item.message}
          </p>
        </div>
      </div>

      {/*
        When the action needs internet and there is none, the card says so
        here — before the button is tapped — rather than firing a toast at
        the bottom of the screen after it.
      */}
      {item.action && isActionBlocked && (
        <p className="flex items-center gap-2 text-[16px] font-semibold text-[var(--pd-warn)] m-0 pt-1 border-t border-[var(--pd-line-2)]">
          <WifiOff className="w-5 h-5 shrink-0" aria-hidden="true" strokeWidth={2.25} />
          {AttentionStrings.needsInternet}
        </p>
      )}

      {/* Action */}
      {item.action && !isActionBlocked && (
        <div className="pt-1 border-t border-[var(--pd-line-2)]">
          <button
            type="button"
            onClick={() => onAction?.(item)}
            className="w-full min-h-[56px] px-4 rounded-[var(--pd-field-radius)] border border-[var(--pd-line)] bg-white inline-flex items-center justify-center gap-1.5 text-[18px] font-extrabold text-[var(--pd-blue)] hover:bg-[var(--pd-tint)] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>{item.action.label}</span>
            <ChevronRight className="w-5 h-5" aria-hidden="true" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </article>
  );
}
