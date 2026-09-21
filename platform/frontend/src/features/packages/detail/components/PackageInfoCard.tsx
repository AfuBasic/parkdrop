import { Calendar, MapPin, UserCheck } from 'lucide-react';
import type { LocalPackage } from '@/offline/db/schema';
import { PackagesStrings } from '@/features/packages/strings';

export interface PackageInfoCardProps {
  pkg: LocalPackage;
  pickupPointName?: string | null;
}

export function PackageInfoCard({ pkg, pickupPointName }: PackageInfoCardProps) {
  const createdDate = new Date(pkg.client_created_at);
  const formattedDate = createdDate.toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = createdDate.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const realPointName = pickupPointName || pkg.pickup_point_name || null;
  const isPlaceholder = !realPointName;

  return (
    <div className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-4 shadow-xs flex flex-col gap-3">
      <h3 className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0">
        {PackagesStrings.infoCardTitle}
      </h3>

      <div className="flex flex-col divide-y divide-[var(--pd-line-2)] text-[15px]">
        {/* Line 1: Received Date & Time */}
        <div className="py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--pd-muted)] font-bold">
            <Calendar className="w-4 h-4" />
            <span>{PackagesStrings.receivedDateLabel}</span>
          </div>
          <span className="font-extrabold text-[var(--pd-navy)] tabular-nums">
            {formattedDate} · {formattedTime}
          </span>
        </div>

        {/* Line 2: Received by */}
        <div className="py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--pd-muted)] font-bold">
            <UserCheck className="w-4 h-4" />
            <span>{PackagesStrings.receivedByLabel}</span>
          </div>
          <span className="font-extrabold text-[var(--pd-navy)]">
            {pkg.creator_name || 'Staff'}
          </span>
        </div>

        {/* Line 3: Package Public ID */}
        <div className="py-2.5 flex items-center justify-between">
          <span className="text-[var(--pd-muted)] font-bold">{PackagesStrings.packageIdLabel}</span>
          <span className="font-mono font-extrabold text-[var(--pd-navy)] tracking-wider">
            {pkg.public_package_id}
          </span>
        </div>

        {/* Line 4: Pickup Point Name */}
        <div className="py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--pd-muted)] font-bold">
            <MapPin className="w-4 h-4" />
            <span>{PackagesStrings.pickupPointLabel}</span>
          </div>
          {isPlaceholder ? (
            <span className="text-[14px] font-bold text-[#92400E] text-right">
              {PackagesStrings.setupRequiredNotice}
            </span>
          ) : (
            <span className="font-extrabold text-[var(--pd-navy)] text-right">
              {realPointName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
