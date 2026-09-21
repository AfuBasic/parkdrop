import React from 'react';
import type { RegisteredDevice } from '../account-types';
import type { LocalAuthorization } from '@/offline/db/schema';

interface CurrentDeviceSectionProps {
  device?: RegisteredDevice | null;
  authorization?: LocalAuthorization | null;
}

export const CurrentDeviceSection: React.FC<CurrentDeviceSectionProps> = ({
  device,
  authorization,
}) => {
  // Format human-readable date for offline access lease
  const formatLeaseExpiry = (expiresAtStr?: string | null): string => {
    if (!expiresAtStr) {
      return 'Available while signed in';
    }
    const expiry = new Date(expiresAtStr);
    const now = new Date();
    
    if (expiry < now) {
      return 'Expired (reconnect to refresh)';
    }

    // Friendly date format: e.g. "Tomorrow at 2:30 PM" or "Sep 22, 2:30 PM"
    const isToday = expiry.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = expiry.toDateString() === tomorrow.toDateString();

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: 'numeric',
    });

    if (isToday) {
      return `Today at ${timeFormatter.format(expiry)}`;
    }
    if (isTomorrow) {
      return `Tomorrow at ${timeFormatter.format(expiry)}`;
    }

    const fullFormatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    return fullFormatter.format(expiry);
  };

  return (
    <section aria-labelledby="current-device-heading" className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100">
        <div>
          <h2 id="current-device-heading" className="text-base font-semibold text-neutral-900 tracking-tight">
            Current Device
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            This browser session and offline field authorization
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" aria-hidden="true" />
          Active now
        </span>
      </div>

      <div className="space-y-3.5">
        <div className="p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-700 shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {device?.device_name || 'This device'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-neutral-200/70 text-neutral-700">
                This Device
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Authorized session for package intake, collection, and search
            </p>
          </div>
        </div>

        {/* Offline Lease Badge */}
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-emerald-950">
              Offline access: {authorization?.expires_at ? `Available until ${formatLeaseExpiry(authorization.expires_at)}` : 'Ready offline'}
            </div>
            <p className="text-[11px] text-emerald-800/80 mt-0.5">
              You can log packages, register customers, and collect deliveries even if the internet disconnects.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
