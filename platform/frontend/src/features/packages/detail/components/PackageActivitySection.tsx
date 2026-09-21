import { CheckCircle2, DollarSign, Camera, CloudUpload, RotateCcw, Ban, PackageCheck } from 'lucide-react';
import type { PackageDetailActivityItem } from '@/features/packages/detail/package-detail-types';

interface PackageActivitySectionProps {
  timeline: PackageDetailActivityItem[];
}

export function PackageActivitySection({ timeline }: PackageActivitySectionProps) {
  if (timeline.length === 0) return null;

  const getIcon = (type: PackageDetailActivityItem['type']) => {
    switch (type) {
      case 'PAYMENT_RECORDED':
        return <DollarSign className="w-3.5 h-3.5 text-action-primary" />;
      case 'PHOTO_ATTACHED':
        return <Camera className="w-3.5 h-3.5 text-text-secondary" />;
      case 'PACKAGE_COLLECTED':
        return <PackageCheck className="w-3.5 h-3.5 text-status-success-text" />;
      case 'PACKAGE_RETURNED':
        return <RotateCcw className="w-3.5 h-3.5 text-status-warning-text" />;
      case 'PACKAGE_CANCELLED':
        return <Ban className="w-3.5 h-3.5 text-status-danger-text" />;
      case 'SYNCED':
        return <CloudUpload className="w-3.5 h-3.5 text-status-success-text" />;
      case 'PACKAGE_RECORDED':
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-status-success-text" />;
    }
  };

  return (
    <div className="bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle p-5 shadow-sm flex flex-col gap-3">
      <h3 className="text-base font-bold text-text-primary tracking-tight">Activity</h3>

      <div className="relative pl-6 flex flex-col gap-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-subtle">
        {timeline.map((item) => (
          <div key={item.id} className="relative flex flex-col gap-0.5">
            {/* Timeline Node Dot */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-surface-page border border-border-subtle flex items-center justify-center">
              {getIcon(item.type)}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary text-sm">
                {item.title}
              </span>
              <span className="text-text-muted tabular-nums">
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {(item.description || item.actorName) && (
              <p className="text-xs text-text-secondary">
                {item.description}
                {item.description && item.actorName && ' · '}
                {item.actorName && `By ${item.actorName}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
