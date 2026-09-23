import React from 'react';
import { Smartphone, ShieldCheck } from 'lucide-react';
import type { RegisteredDevice } from '../account-types';
import type { LocalAuthorization } from '@/offline/db/schema';
import { AccountStrings } from '@/features/account/strings';

interface CurrentDeviceSectionProps {
  device?: RegisteredDevice | null;
  authorization?: LocalAuthorization | null;
}

export const CurrentDeviceSection: React.FC<CurrentDeviceSectionProps> = ({
  device,
  authorization,
}) => {
  // Friendly date format: "Today at 2:30 PM" / "Tomorrow at 2:30 PM" / "Sep 22, 2:30 PM"
  const formatLeaseExpiry = (expiresAtStr?: string | null): string | null => {
    if (!expiresAtStr) return null;
    const expiry = new Date(expiresAtStr);
    const now = new Date();
    if (expiry < now) return null;

    const isToday = expiry.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = expiry.toDateString() === tomorrow.toDateString();

    const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric' });

    if (isToday) return `Today at ${timeFormatter.format(expiry)}`;
    if (isTomorrow) return `Tomorrow at ${timeFormatter.format(expiry)}`;

    const fullFormatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    return fullFormatter.format(expiry);
  };

  const isExpired = !!authorization?.expires_at && new Date(authorization.expires_at) < new Date();
  const leaseText = formatLeaseExpiry(authorization?.expires_at);

  return (
    <section
      aria-labelledby="current-device-heading"
      className="bg-white rounded-[var(--pd-card-radius)] border border-[var(--pd-line-2)] p-5 shadow-sm"
    >
      <h2
        id="current-device-heading"
        className="text-[18px] font-extrabold text-[var(--pd-navy)] m-0 mb-4 pb-3 border-b border-[var(--pd-line-2)]"
      >
        {AccountStrings.thisPhoneHeading}
      </h2>

      <div className="flex flex-col gap-3">
        <div className="p-3.5 rounded-[var(--pd-field-radius)] bg-[var(--pd-page-2)] border border-[var(--pd-line-2)] flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-[var(--pd-line-2)] text-[var(--pd-navy)] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[18px] font-bold text-[var(--pd-navy)] truncate block">
              {device?.device_name || AccountStrings.thisPhoneLabel}
            </span>
            <p className="text-[15px] text-[var(--pd-muted)] mt-0.5 m-0">{AccountStrings.thisPhoneBody}</p>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-[var(--pd-field-radius)] border flex items-start gap-3 ${
            isExpired
              ? 'bg-[var(--pd-warn-bg)] border-[var(--pd-warn)]/25'
              : 'bg-[var(--pd-ok-bg)] border-[var(--pd-ok)]/25'
          }`}
        >
          <ShieldCheck
            className={`w-5 h-5 shrink-0 mt-0.5 ${isExpired ? 'text-[var(--pd-warn)]' : 'text-[var(--pd-ok)]'}`}
            strokeWidth={2.25}
            aria-hidden="true"
          />
          <p
            className={`text-[15px] font-semibold m-0 ${isExpired ? 'text-[var(--pd-warn)]' : 'text-[var(--pd-ok)]'}`}
          >
            {isExpired
              ? AccountStrings.offlineExpired
              : leaseText
                ? AccountStrings.offlineUntil(leaseText)
                : AccountStrings.offlineReady}
          </p>
        </div>
      </div>
    </section>
  );
};
