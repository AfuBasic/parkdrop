import { useState } from 'react';
import { CheckCircle2, DollarSign, Camera, RotateCcw, Ban, PackageCheck, Send, Clock, XCircle, HelpCircle } from 'lucide-react';
import type { PackageDetailActivityItem } from '@/features/packages/detail/package-detail-types';
import { PackagesStrings } from '@/features/packages/strings';

export interface PackageActivitySectionProps {
  timeline: PackageDetailActivityItem[];
}

export function PackageActivitySection({ timeline }: PackageActivitySectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (timeline.length === 0) return null;

  const displayedItems = showAll ? timeline : timeline.slice(-3);

  const getIcon = (type: PackageDetailActivityItem['type']) => {
    switch (type) {
      case 'PAYMENT_RECORDED':
        return <DollarSign className="w-4 h-4 text-[var(--pd-blue)]" />;
      case 'PHOTO_ATTACHED':
        return <Camera className="w-4 h-4 text-[var(--pd-muted)]" />;
      case 'PACKAGE_COLLECTED':
        return <PackageCheck className="w-4 h-4 text-[#15803D]" />;
      case 'PACKAGE_RETURNED':
        return <RotateCcw className="w-4 h-4 text-[#D97706]" />;
      case 'PACKAGE_CANCELLED':
        return <Ban className="w-4 h-4 text-[var(--pd-bad)]" />;
      // SMS delivery states — distinct icon + colour per state
      case 'ARRIVAL_SMS_DELIVERED':
        return <CheckCircle2 className="w-4 h-4 text-[#15803D]" />;
      case 'ARRIVAL_SMS_SENT':
        return <Send className="w-4 h-4 text-[var(--pd-blue)]" />;
      case 'ARRIVAL_SMS_QUEUED':
        return <Clock className="w-4 h-4 text-[var(--pd-blue)]" />;
      case 'ARRIVAL_SMS_FAILED':
      case 'ARRIVAL_SMS_UNDELIVERED':
        return <XCircle className="w-4 h-4 text-[var(--pd-bad)]" />;
      case 'ARRIVAL_SMS_NEEDS_RECONCILIATION':
        return <HelpCircle className="w-4 h-4 text-[#D97706]" />;
      case 'SYNCED':
      case 'PACKAGE_RECORDED':
      default:
        return <CheckCircle2 className="w-4 h-4 text-[#15803D]" />;
    }
  };

  return (
    <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-4 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0">
          {PackagesStrings.activityTitle}
        </h3>

        {timeline.length > 3 && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-[14px] font-extrabold text-[var(--pd-blue)] hover:underline min-h-[44px] px-2 flex items-center"
          >
            {PackagesStrings.seeAllActivity} ({timeline.length})
          </button>
        )}
      </div>

      <div className="flex flex-col divide-y divide-[var(--pd-line-2)]">
        {displayedItems.map((item) => (
          <div key={item.id} className="py-2.5 flex items-start gap-3 text-[14px]">
            <div className="p-1.5 rounded-full bg-[var(--pd-page)] border border-[var(--pd-line)] mt-0.5 shrink-0">
              {getIcon(item.type)}
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-[var(--pd-navy)] leading-tight">
                  {item.title}
                </span>
                <span className="text-[13px] font-bold text-[var(--pd-muted)] tabular-nums shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              {(item.description || item.actorName) && (
                <span className="text-[13px] font-bold text-[var(--pd-muted)] mt-0.5">
                  {item.description}
                  {item.description && item.actorName && ' · '}
                  {item.actorName && `by ${item.actorName}`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
