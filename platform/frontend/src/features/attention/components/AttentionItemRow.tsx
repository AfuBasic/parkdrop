import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ImageOff, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import type { AttentionItem } from '@/features/attention/attention-types';

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

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
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
  onSelect,
}: AttentionItemRowProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'PHOTO_UPLOAD_FAILED':
        return <ImageOff className="w-4 h-4 text-status-danger-text" aria-hidden="true" />;
      case 'PAYMENT_SYNC_REJECTED':
      case 'ZERO_SMS_CREDITS':
        return <AlertCircle className="w-4 h-4 text-status-danger-text" aria-hidden="true" />;
      case 'COLLECTION_SYNC_CONFLICT':
      case 'PACKAGE_LIFECYCLE_CONFLICT':
      case 'LOW_SMS_CREDITS':
      case 'SMS_CREDIT_PURCHASE_FAILED':
        return <AlertTriangle className="w-4 h-4 text-status-warning-text" aria-hidden="true" />;
      case 'SMS_CREDIT_PURCHASE_PENDING':
        return <Clock className="w-4 h-4 text-action-primary" aria-hidden="true" />;
      default:
        return <Info className="w-4 h-4 text-text-muted" aria-hidden="true" />;
    }
  };

  const getIconBg = () => {
    switch (item.severity) {
      case 'ERROR':
        return 'bg-status-danger-bg border-status-danger-border text-status-danger-text';
      case 'WARNING':
        return 'bg-status-warning-bg border-status-warning-border text-status-warning-text';
      case 'INFO':
      default:
        return 'bg-blue-50 border-blue-200 text-action-primary';
    }
  };

  const isActionDisabled = Boolean(item.action?.requiresOnline && isOffline);
  const actionLabel = isActionDisabled
    ? 'Connect to internet'
    : item.action?.label;

  const accessibleLabel = `${item.title}. ${item.metadata?.publicPackageId ? `Package ${item.metadata.publicPackageId}. ` : ''}${item.message}`;

  return (
    <article
      aria-label={accessibleLabel}
      className="bg-surface-default border border-border-subtle rounded-[var(--radius-xl)] p-4 shadow-sm flex flex-col gap-3 transition-colors hover:border-border-default"
    >
      <div className="flex items-start gap-3">
        {/* Severity / Type Icon */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${getIconBg()}`}
        >
          {getIcon()}
        </div>

        {/* Content Block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-text-primary leading-snug">
              {item.title}
            </h3>
            {item.occurredAt && (
              <span className="text-xs text-text-muted shrink-0 tabular-nums pt-0.5">
                {formatOccurredAt(item.occurredAt)}
              </span>
            )}
          </div>

          {/* Context Identifier: Package ID / Customer name / Amount */}
          {(item.metadata?.publicPackageId || item.metadata?.customerName) && (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-action-primary">
              {item.metadata.publicPackageId && (
                <span className="tracking-wider">{item.metadata.publicPackageId}</span>
              )}
              {item.metadata.publicPackageId && item.metadata.customerName && (
                <span className="text-text-muted">·</span>
              )}
              {item.metadata.customerName && (
                <span className="text-text-secondary truncate">{item.metadata.customerName}</span>
              )}
            </div>
          )}

          {/* Message Body */}
          <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed">
            {item.message}
          </p>
        </div>
      </div>

      {/* Action Affordance */}
      {item.action && (
        <div className="flex items-center justify-end pt-1 border-t border-border-subtle/60">
          <button
            type="button"
            disabled={isActionDisabled}
            onClick={() => onAction?.(item)}
            className="min-h-[44px] px-3.5 py-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-action-primary hover:text-action-primary-hover active:bg-surface-subtle disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
          >
            <span>{actionLabel}</span>
            {!isActionDisabled && (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      )}
    </article>
  );
}
