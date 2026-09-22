import React from 'react';
import type { RegisteredDevice } from '../account-types';
import { AccountStrings } from '@/features/account/strings';

interface DeviceRowProps {
  device: RegisteredDevice;
  onRevoke: (deviceId: number) => Promise<void>;
  isRevoking?: boolean;
}

/** "2 hours ago", "3 days ago" — never a raw timestamp. */
function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return 'never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) return 'a moment ago';
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export const DeviceRow: React.FC<DeviceRowProps> = ({ device, onRevoke, isRevoking = false }) => {
  return (
    <div
      data-testid={`device-row-${device.id}`}
      className={`p-4 rounded-[var(--pd-field-radius)] border ${
        device.is_revoked
          ? 'bg-[var(--pd-page-2)] border-[var(--pd-line-2)] opacity-60'
          : 'bg-white border-[var(--pd-line-2)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[18px] font-bold text-[var(--pd-navy)] truncate">
              {device.device_name || AccountStrings.thisPhoneLabel}
            </span>
            <span
              className={`text-[15px] font-semibold ${
                device.is_revoked ? 'text-[var(--pd-bad)]' : 'text-[var(--pd-ok)]'
              }`}
            >
              {device.is_revoked ? AccountStrings.signedOut : AccountStrings.active}
            </span>
          </div>

          <p className="text-[15px] font-semibold text-[var(--pd-muted)] mt-1 m-0">
            {AccountStrings.lastUsed(formatTimeAgo(device.last_seen_at || device.authorized_at))}
            {device.authorized_at ? ` · ${AccountStrings.addedOn(formatTimeAgo(device.authorized_at))}` : ''}
          </p>
        </div>

        {!device.is_revoked && (
          <button
            type="button"
            onClick={() => onRevoke(device.id)}
            disabled={isRevoking}
            className="min-h-[48px] px-3 shrink-0 text-[16px] font-extrabold text-[var(--pd-bad)] disabled:opacity-50 cursor-pointer"
          >
            {isRevoking ? AccountStrings.signingOut : AccountStrings.signThisPhoneOut}
          </button>
        )}
      </div>
    </div>
  );
};
