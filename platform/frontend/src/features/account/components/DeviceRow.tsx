import React from 'react';
import type { RegisteredDevice } from '../account-types';

interface DeviceRowProps {
  device: RegisteredDevice;
  onRevoke: (deviceId: number) => Promise<void>;
  isRevoking?: boolean;
}

export const DeviceRow: React.FC<DeviceRowProps> = ({
  device,
  onRevoke,
  isRevoking = false,
}) => {
  const formatTimeAgo = (dateStr?: string | null): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div
      data-testid={`device-row-${device.id}`}
      className={`p-3.5 rounded-xl border transition-all ${
        device.is_revoked
          ? 'bg-neutral-50/50 border-neutral-200/50 opacity-60'
          : 'bg-white border-neutral-200/80 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-neutral-900 truncate">
              {device.device_name || 'Browser session'}
            </span>
            {device.is_revoked ? (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60">
                Revoked
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 flex-wrap">
            <span>Last active: <strong className="font-medium text-neutral-700">{formatTimeAgo(device.last_seen_at || device.authorized_at)}</strong></span>
            {device.authorized_at && (
              <span>• Added: {formatTimeAgo(device.authorized_at)}</span>
            )}
          </div>
        </div>

        {/* Revoke Action */}
        {!device.is_revoked && (
          <button
            type="button"
            onClick={() => onRevoke(device.id)}
            disabled={isRevoking}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100 border border-rose-200/80 disabled:opacity-50 transition-colors shrink-0 focus:outline-hidden"
          >
            {isRevoking ? 'Revoking...' : 'Revoke'}
          </button>
        )}
      </div>
    </div>
  );
};
