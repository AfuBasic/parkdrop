import { Calendar, MapPin, UserCheck, MessageSquare } from 'lucide-react';
import type { LocalPackage } from '@/offline/db/schema';

interface PackageInfoCardProps {
  pkg: LocalPackage;
}

export function PackageInfoCard({ pkg }: PackageInfoCardProps) {
  const formattedDate = pkg.client_created_at
    ? new Date(pkg.client_created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown';

  const formattedTime = pkg.client_created_at
    ? new Date(pkg.client_created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="bg-surface-default rounded-[var(--radius-2xl)] border border-border-subtle p-5 shadow-sm flex flex-col gap-3">
      <h3 className="text-base font-bold text-text-primary tracking-tight">Package details</h3>

      <div className="flex flex-col divide-y divide-border-subtle text-sm">
        {/* Received Timestamp */}
        <div className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2 text-text-secondary">
            <Calendar className="w-4 h-4 text-text-muted" />
            <span>Received</span>
          </span>
          <span className="font-semibold text-text-primary tabular-nums">
            {formattedDate} {formattedTime && `· ${formattedTime}`}
          </span>
        </div>

        {/* Pickup Point */}
        <div className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2 text-text-secondary">
            <MapPin className="w-4 h-4 text-text-muted" />
            <span>Pickup Point</span>
          </span>
          <span className="font-semibold text-text-primary">
            {pkg.pickup_point_name || 'Main Location'}
          </span>
        </div>

        {/* Staff Attribution */}
        <div className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2 text-text-secondary">
            <UserCheck className="w-4 h-4 text-text-muted" />
            <span>Recorded by</span>
          </span>
          <span className="font-semibold text-text-primary">
            {pkg.creator_name || 'Attendant'}
          </span>
        </div>

        {/* Arrival SMS Status */}
        <div className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2 text-text-secondary">
            <MessageSquare className="w-4 h-4 text-text-muted" />
            <span>Arrival SMS</span>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-status-success-bg text-status-success-text border border-status-success-border">
            Delivered
          </span>
        </div>
      </div>
    </div>
  );
}
