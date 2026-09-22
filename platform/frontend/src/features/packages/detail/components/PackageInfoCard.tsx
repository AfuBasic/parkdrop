import { Calendar, MapPin, UserCheck, Hash, Info, CheckCircle2 } from 'lucide-react';
import type { LocalPackage } from '@/offline/db/schema';
import { PackagesStrings } from '@/features/packages/strings';
import { Section } from '@/design-system/shell/Section';

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

  let collectedDateStr = null;
  if (pkg.status === 'COLLECTED') {
    if (pkg.collected_at) {
      const collectedDate = new Date(pkg.collected_at);
      const cDate = collectedDate.toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const cTime = collectedDate.toLocaleTimeString('en-NG', {
        hour: 'numeric',
        minute: '2-digit',
      });
      collectedDateStr = `${cDate} · ${cTime}`;
    } else {
      collectedDateStr = 'Unknown'; // Fallback for legacy packages without a recorded collection time
    }
  }

  const realPointName = pickupPointName || pkg.pickup_point_name || null;
  const isPlaceholder = !realPointName;

  const creatorDisplay = pkg.creator_phone && pkg.creator_name
    ? `${pkg.creator_name} · ${pkg.creator_phone}`
    : pkg.creator_name || 'Staff';

  return (
    <Section
      icon={<Info className="w-4 h-4" />}
      label={PackagesStrings.infoCardTitle}
    >
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

        {/* Optional Line: Collected Date & Time */}
        {collectedDateStr && (
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#15803D] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{PackagesStrings.collectedAtLabel}</span>
            </div>
            <span className="font-extrabold text-[#15803D] tabular-nums">
              {collectedDateStr}
            </span>
          </div>
        )}

        {/* Line 2: Received by */}
        <div className="py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--pd-muted)] font-bold">
            <UserCheck className="w-4 h-4" />
            <span>{PackagesStrings.receivedByLabel}</span>
          </div>
          <span className="font-extrabold text-[var(--pd-navy)]">
            {creatorDisplay}
          </span>
        </div>

        {/* Line 3: Package Public ID */}
        <div className="py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--pd-muted)] font-bold">
            <Hash className="w-4 h-4" />
            <span>{PackagesStrings.packageIdLabel}</span>
          </div>
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
            <span className="text-[15px] font-bold text-[#92400E] text-right">
              {PackagesStrings.setupRequiredNotice}
            </span>
          ) : (
            <span className="font-extrabold text-[var(--pd-navy)] text-right">
              {realPointName}
            </span>
          )}
        </div>
      </div>
    </Section>
  );
}
